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
  ) {}

  async cast(player: Player, request: CastRequest): Promise<void> {
    const source = await this.#location(request.serverId);
    const token = await this.tokens.get();
    const playQueueId = await this.#createPlayQueue(source.base, token, request);
    this.#activeType.set(player.clientId, toTimelineType(request.kind));

    await this.#command(player, '/player/playback/playMedia', {
      key: `/library/metadata/${request.ratingKey}`,
      offset: Math.max(0, Math.round(request.offsetMs)),
      machineIdentifier: request.serverId,
      address: source.address,
      port: source.port,
      protocol: 'http',
      token,
      containerKey: `/playQueues/${playQueueId}`,
      type: this.#typeOf(player),
    });
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
