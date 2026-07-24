import type { Environment } from '../../config/environment.js';
import type { TokenProvider } from '../../config/TokenProvider.js';
import type { PlexConnection, Server } from '../../domain/entities/Server.js';
import { PlexHttpClient } from './PlexHttpClient.js';
import { plexHeaders } from './plexHeaders.js';

interface IdentityResponse {
  MediaContainer?: { machineIdentifier?: string };
}

/**
 * Resolves a *verified* base URL for a server by probing its candidate
 * connections and confirming each one's machineIdentifier matches. This is
 * essential because two servers on a LAN can advertise the same private
 * addresses (e.g. 172.17.0.1 docker bridges), so a naive "first local" pick
 * can silently target the wrong machine. Verified results are cached.
 */
export class ConnectionResolver {
  #cache = new Map<string, { base: string; at: number }>();
  static readonly #TTL_MS = 300_000;
  static readonly #PROBE_TIMEOUT_MS = 1500;

  constructor(
    private readonly env: Environment,
    private readonly tokens: TokenProvider,
    private readonly http: PlexHttpClient,
  ) {}

  async resolve(server: Server): Promise<string> {
    const hit = this.#cache.get(server.id);
    if (hit && Date.now() - hit.at < ConnectionResolver.#TTL_MS) return hit.base;

    for (const connection of order(server.connections)) {
      const base = `http://${connection.address}:${connection.port}`;
      if (await this.#identityMatches(base, server.id)) {
        this.#cache.set(server.id, { base, at: Date.now() });
        return base;
      }
    }
    return this.env.primaryServerUrl;
  }

  async #identityMatches(base: string, serverId: string): Promise<boolean> {
    try {
      const token = await this.tokens.get();
      const data = await this.http.json<IdentityResponse>(`${base}/identity`, {
        headers: plexHeaders(this.env, token),
        timeoutMs: ConnectionResolver.#PROBE_TIMEOUT_MS,
        retries: 0,
      });
      return data.MediaContainer?.machineIdentifier === serverId;
    } catch {
      return false;
    }
  }
}

/** Probe order: LAN before docker/VPN, local before remote, plain before relay. */
function order(connections: readonly PlexConnection[]): PlexConnection[] {
  return [...connections].sort((a, b) => rank(b) - rank(a));
}

function rank(c: PlexConnection): number {
  let score = c.local ? 4 : 0;
  if (c.address.startsWith('192.168.')) score += 3;
  else if (c.address.startsWith('10.')) score += 2;
  else if (c.address.startsWith('172.')) score += 1;
  return score;
}
