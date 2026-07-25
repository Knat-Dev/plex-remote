import type { Environment } from '../../config/environment.js';
import type { TokenProvider } from '../../config/TokenProvider.js';
import type { PlayerDirectory } from '../../domain/ports/PlayerDirectory.js';
import type { Player, PlayerCapability } from '../../domain/entities/Player.js';
import { PlexHttpClient } from './PlexHttpClient.js';
import { ServerRegistry } from './ServerRegistry.js';
import { plexHeaders } from './plexHeaders.js';

interface ClientDto {
  name?: string;
  machineIdentifier?: string;
  product?: string;
  platform?: string;
  protocolCapabilities?: string;
}
interface ClientsContainer {
  MediaContainer?: { Server?: ClientDto[] };
}

/**
 * Aggregates players from every reachable server's `/clients` endpoint.
 * A player is keyed by clientId; the first server that reports it becomes the
 * relay used to route its commands (`viaServerId`).
 *
 * Plex's `/clients` is unreliable: a live player (Android TV / SHIELD notably)
 * intermittently drops out of a single response as its GDM announce expires and
 * re-registers, even though it is perfectly reachable. Resolving a command
 * against a fresh `/clients` hit therefore fails at random ("buttons do
 * nothing"), and the presence list flickers players in and out. So we keep a
 * short-lived presence cache: a player stays "present" until it has been ABSENT
 * for longer than the grace window, which bridges the blips while still
 * dropping a genuinely-closed player within a few seconds. Commands additionally
 * fall back to the last-known entry beyond the window — sending to a stale relay
 * harmlessly no-ops, which is strictly better than a 500.
 */
export class PlexPlayerDirectory implements PlayerDirectory {
  readonly #seen = new Map<string, { player: Player; at: number }>();
  static readonly #PRESENCE_TTL_MS = 15_000;

  constructor(
    private readonly env: Environment,
    private readonly tokens: TokenProvider,
    private readonly http: PlexHttpClient,
    private readonly registry: ServerRegistry,
  ) {}

  async listPlayers(): Promise<Player[]> {
    const fresh = await this.#fetchPlayers();
    const now = Date.now();
    for (const player of fresh) this.#seen.set(player.clientId, { player, at: now });
    for (const [id, entry] of this.#seen) {
      if (now - entry.at > PlexPlayerDirectory.#PRESENCE_TTL_MS) this.#seen.delete(id);
    }
    return [...this.#seen.values()].map((entry) => entry.player);
  }

  async findPlayer(clientId: string): Promise<Player | undefined> {
    const cached = this.#seen.get(clientId);
    if (cached && Date.now() - cached.at < PlexPlayerDirectory.#PRESENCE_TTL_MS) {
      return cached.player;
    }
    // Unknown or stale — refresh once, then look again.
    await this.listPlayers();
    const refreshed = this.#seen.get(clientId);
    if (refreshed) return refreshed.player;
    // Never in this refresh, but if we ever saw it, resolve best-effort so a
    // command targets its last-known relay instead of throwing NotFound.
    return cached?.player;
  }

  async #fetchPlayers(): Promise<Player[]> {
    const servers = await this.registry.servers();
    const perServer = await Promise.allSettled(
      servers.map((s) => this.#clientsOf(s.id)),
    );
    const byId = new Map<string, MutablePlayer>();
    perServer.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const serverId = servers[index]?.id ?? '';
      for (const dto of result.value) {
        const clientId = dto.machineIdentifier;
        if (!clientId) continue;
        const existing = byId.get(clientId);
        if (existing) {
          if (!existing.viaServerIds.includes(serverId)) existing.viaServerIds.push(serverId);
        } else {
          byId.set(clientId, toMutablePlayer(dto, serverId));
        }
      }
    });
    return [...byId.values()].map(freeze);
  }

  async #clientsOf(serverId: string): Promise<ClientDto[]> {
    const base = await this.registry.baseUrl(serverId);
    const token = await this.tokens.get();
    const data = await this.http.json<ClientsContainer>(`${base}/clients`, {
      headers: plexHeaders(this.env, token),
      timeoutMs: this.env.requestTimeoutMs,
      retries: 1,
    });
    return data.MediaContainer?.Server ?? [];
  }
}

interface MutablePlayer extends Omit<Player, 'viaServerIds'> {
  viaServerIds: string[];
}

function toMutablePlayer(dto: ClientDto, viaServerId: string): MutablePlayer {
  return {
    clientId: dto.machineIdentifier ?? '',
    name: dto.name ?? 'Player',
    product: dto.product ?? '',
    platform: dto.platform ?? '',
    capabilities: parseCapabilities(dto.protocolCapabilities),
    viaServerIds: [viaServerId],
  };
}

function freeze(player: MutablePlayer): Player {
  return { ...player, viaServerIds: [...player.viaServerIds] };
}

function parseCapabilities(raw: string | undefined): PlayerCapability[] {
  const known: readonly PlayerCapability[] = [
    'timeline', 'playback', 'navigation', 'mirror', 'playqueues', 'provider-playback',
  ];
  const present = new Set((raw ?? '').split(','));
  return known.filter((cap) => present.has(cap));
}
