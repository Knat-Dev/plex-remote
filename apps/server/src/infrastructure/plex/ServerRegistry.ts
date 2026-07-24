import type { Environment } from '../../config/environment.js';
import type { TokenProvider } from '../../config/TokenProvider.js';
import type { Server, PlexConnection } from '../../domain/entities/Server.js';
import { PlexHttpClient } from './PlexHttpClient.js';
import { ConnectionResolver } from './ConnectionResolver.js';
import { plexHeaders } from './plexHeaders.js';

interface ResourceDto {
  name: string;
  clientIdentifier: string;
  provides: string;
  connections?: Array<{ uri: string; address: string; port: number; local: boolean }>;
}

/**
 * Owns the mapping from server id -> reachable base URL and the list of servers.
 * Cached briefly so browsing/casting don't re-hit plex.tv on every request.
 */
export class ServerRegistry {
  #cache: { servers: Server[]; at: number } | undefined;
  static readonly #TTL_MS = 60_000;

  constructor(
    private readonly env: Environment,
    private readonly tokens: TokenProvider,
    private readonly http: PlexHttpClient,
    private readonly connections: ConnectionResolver,
  ) {}

  async servers(): Promise<Server[]> {
    if (this.#cache && Date.now() - this.#cache.at < ServerRegistry.#TTL_MS) {
      return this.#cache.servers;
    }
    const servers = await this.#discover();
    this.#cache = { servers, at: Date.now() };
    return servers;
  }

  async baseUrl(serverId: string): Promise<string> {
    const server = (await this.servers()).find((s) => s.id === serverId);
    if (!server) {
      // Fall back to the primary server when discovery is unavailable.
      return this.env.primaryServerUrl;
    }
    return this.connections.resolve(server);
  }

  async #discover(): Promise<Server[]> {
    const token = await this.tokens.get();
    const resources = await this.http.json<ResourceDto[]>(
      'https://plex.tv/api/v2/resources',
      {
        headers: plexHeaders(this.env, token),
        query: { includeHttps: 1, includeRelay: 0 },
        timeoutMs: this.env.requestTimeoutMs,
      },
    );
    return resources
      .filter((r) => r.provides.split(',').includes('server'))
      .map(toServer);
  }
}

function toServer(dto: ResourceDto): Server {
  const connections: PlexConnection[] = (dto.connections ?? []).map((c) => ({
    uri: c.uri,
    address: c.address,
    port: c.port,
    local: c.local,
  }));
  return { id: dto.clientIdentifier, name: dto.name, connections };
}
