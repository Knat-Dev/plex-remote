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
 */
export class PlexPlayerDirectory implements PlayerDirectory {
  constructor(
    private readonly env: Environment,
    private readonly tokens: TokenProvider,
    private readonly http: PlexHttpClient,
    private readonly registry: ServerRegistry,
  ) {}

  async listPlayers(): Promise<Player[]> {
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

  async findPlayer(clientId: string): Promise<Player | undefined> {
    return (await this.listPlayers()).find((p) => p.clientId === clientId);
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
