import type { Environment } from '../../config/environment.js';
import type { TokenProvider } from '../../config/TokenProvider.js';
import type { Player } from '../../domain/entities/Player.js';
import type {
  PlaybackState,
  PlaybackStatus,
  TimelineType,
} from '../../domain/entities/PlaybackState.js';
import { IDLE_STATE } from '../../domain/entities/PlaybackState.js';
import type {
  CastRequest,
  MediaKind,
  NavigationAction,
  PlaybackCommand,
  PlayerController,
} from '../../domain/ports/PlayerController.js';
import { PlexHttpClient } from './PlexHttpClient.js';
import { ServerRegistry } from './ServerRegistry.js';
import { CommandSequence } from './CommandSequence.js';
import { RelayResolver } from './RelayResolver.js';
import type { ContentIdentity } from './ContentIdentity.js';
import { plexHeaders, targetHeader } from './plexHeaders.js';
import { parseTimelines, type TimelineAttributes } from './timelineXml.js';

interface PlayQueueResponse {
  MediaContainer?: { playQueueID?: number };
}

/**
 * The relay can hold the command socket open while the player picks the command
 * up on its poll cycle, so command requests use a short timeout, never retry
 * (a retried playMedia would double-cast), and treat a timeout as delivered —
 * the real outcome is confirmed by the timeline poll.
 */
const COMMAND_TIMEOUT_MS = 2500;

/**
 * Drives a single player through the Plex companion command API.
 *
 * Two invariants learned the hard way, now load-bearing:
 * - Transport commands (pause/play/seek/…) MUST carry the media `type` of the
 *   timeline they address; players silently ignore untyped commands while the
 *   relay still answers 200. We track each player's active timeline type from
 *   its state reads and casts.
 * - A command must be delivered through exactly ONE relay server. A player can
 *   be registered with several servers and each relays independently, so
 *   broadcasting a command makes the player execute it once per server.
 */
export class PlexPlayerController implements PlayerController {
  readonly #activeType = new Map<string, TimelineType>();

  constructor(
    private readonly env: Environment,
    private readonly tokens: TokenProvider,
    private readonly http: PlexHttpClient,
    private readonly registry: ServerRegistry,
    private readonly relays: RelayResolver,
    private readonly seq: CommandSequence,
    private readonly identity: ContentIdentity,
  ) {}

  async cast(player: Player, request: CastRequest): Promise<void> {
    const source = await this.#location(request.serverId);
    // Build the play queue and stream with the ACTIVE USER's token so the
    // queue item carries THEIR viewOffset — that's what lets the player resume
    // natively (start straight at the offset), and it scrobbles progress back
    // to the right user. The admin token would carry the owner's offset (0).
    const token = await this.identity.tokenForServer(request.serverId);
    const playQueueId = await this.#createPlayQueue(source.base, token, request);
    this.#activeType.set(player.clientId, toTimelineType(request.kind));

    const offset = Math.max(0, Math.round(request.offsetMs));
    await this.#command(player, '/player/playback/playMedia', {
      key: `/library/metadata/${request.ratingKey}`,
      offset,
      machineIdentifier: request.serverId,
      address: source.address,
      port: source.port,
      protocol: 'http',
      token,
      containerKey: `/playQueues/${playQueueId}`,
      type: this.#typeOf(player),
    });

    // Some players (Plex HTPC) ignore playMedia's `offset` and always start at
    // 0. Seeking *does* work, so once playback is actually running we jump to
    // the resume point. Fire-and-forget so casting returns immediately.
    if (offset > 0) void this.#resumeSeek(player, offset);
  }

  /**
   * Resume workaround. Plex HTPC ignores playMedia's offset and the play-queue
   * viewOffset (verified), so it always starts at 0 — but it honours seekTo
   * once playing. We watch for playback and seek to the resume point. Because
   * the state read can fail when the player's timeline is served by a remote
   * server, a guaranteed fallback seek fires at the end so resume works for
   * ANY offset and ANY content server, even when state reads never succeed.
   */
  async #resumeSeek(player: Player, offsetMs: number): Promise<void> {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      await delay(700);
      let state: PlaybackState | undefined;
      try {
        state = await this.getState(player);
      } catch {
        state = undefined; // relay/timeline read failed — keep waiting
      }
      if (!state || state.status === 'stopped') continue;
      // Already at/past the resume point (some players do honour it) — done.
      if (state.timeMs >= offsetMs - 5000) return;
      await this.seek(player, offsetMs).catch(() => undefined);
      return;
    }
    // State never became readable (e.g. remote-served timeline) but playback is
    // almost certainly running by now — seek unconditionally so resume still
    // happens.
    await this.seek(player, offsetMs).catch(() => undefined);
  }

  playback(player: Player, command: PlaybackCommand): Promise<void> {
    return this.#command(player, `/player/playback/${command}`, {
      type: this.#typeOf(player),
    });
  }

  navigate(player: Player, action: NavigationAction): Promise<void> {
    return this.#command(player, `/player/navigation/${action}`, {});
  }

  setVolume(player: Player, level: number): Promise<void> {
    const clamped = Math.max(0, Math.min(100, Math.round(level)));
    return this.#command(player, '/player/playback/setParameters', {
      volume: clamped,
      type: this.#typeOf(player),
    });
  }

  seek(player: Player, offsetMs: number): Promise<void> {
    return this.#command(player, '/player/playback/seekTo', {
      offset: Math.max(0, Math.round(offsetMs)),
      type: this.#typeOf(player),
    });
  }

  async getState(player: Player): Promise<PlaybackState> {
    const base = await this.relays.resolve(player);
    const token = await this.tokens.get();
    const res = await this.http.raw(`${base}/player/timeline/poll`, {
      headers: { ...plexHeaders(this.env, token), ...targetHeader(player.clientId) },
      query: { wait: 0, commandID: this.seq.next() },
      timeoutMs: this.env.requestTimeoutMs,
      retries: 1,
    });
    const state = toPlaybackState(parseTimelines(await res.text()));
    if (state.mediaType) this.#activeType.set(player.clientId, state.mediaType);
    return state;
  }

  async #createPlayQueue(
    base: string,
    token: string,
    request: CastRequest,
  ): Promise<number> {
    const uri = `server://${request.serverId}/com.plexapp.plugins.library/library/metadata/${request.ratingKey}`;
    const data = await this.http.json<PlayQueueResponse>(`${base}/playQueues`, {
      method: 'POST',
      headers: plexHeaders(this.env, token),
      query: { type: request.kind, uri, continuous: 0 },
      timeoutMs: this.env.requestTimeoutMs,
    });
    const id = data.MediaContainer?.playQueueID;
    if (!id) throw new Error('Plex did not return a playQueueID');
    return id;
  }

  /** Deliver a command through the single relay that owns this player. */
  async #command(
    player: Player,
    path: string,
    query: Record<string, string | number | undefined>,
  ): Promise<void> {
    const base = await this.relays.resolve(player);
    const token = await this.tokens.get();
    try {
      const res = await this.http.raw(`${base}${path}`, {
        headers: { ...plexHeaders(this.env, token), ...targetHeader(player.clientId) },
        query: { ...query, commandID: this.seq.next() },
        timeoutMs: COMMAND_TIMEOUT_MS,
        retries: 0,
      });
      await res.body?.cancel().catch(() => undefined);
    } catch (error) {
      if (!isTimeout(error)) throw error;
    }
  }

  #typeOf(player: Player): TimelineType {
    return this.#activeType.get(player.clientId) ?? 'video';
  }

  async #location(serverId: string): Promise<{ base: string; address: string; port: number }> {
    const base = await this.registry.baseUrl(serverId);
    const url = new URL(base);
    return { base, address: url.hostname, port: Number(url.port) || 32400 };
  }
}

function toTimelineType(kind: MediaKind): TimelineType {
  return kind === 'audio' ? 'music' : kind;
}

function toPlaybackState(timelines: TimelineAttributes[]): PlaybackState {
  const active =
    timelines.find((t) => t.state && t.state !== 'stopped') ??
    timelines.find((t) => t.type === 'video');
  if (!active || !active.state) return IDLE_STATE;
  return {
    status: normaliseStatus(active.state),
    ...(isTimelineType(active.type) ? { mediaType: active.type } : {}),
    ...(active.ratingKey !== undefined ? { ratingKey: active.ratingKey } : {}),
    ...(active.machineIdentifier !== undefined
      ? { contentServerId: active.machineIdentifier }
      : {}),
    timeMs: active.time ?? 0,
    durationMs: active.duration ?? 0,
    ...(active.volume !== undefined ? { volume: active.volume } : {}),
    muted: truthy(active.muted),
    repeat: truthy(active.repeat),
    shuffle: truthy(active.shuffle),
  };
}

function isTimelineType(type: string | undefined): type is TimelineType {
  return type === 'video' || type === 'music' || type === 'photo';
}

function normaliseStatus(state: string): PlaybackStatus {
  return state === 'playing' || state === 'paused' || state === 'buffering'
    ? state
    : 'stopped';
}

function truthy(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
