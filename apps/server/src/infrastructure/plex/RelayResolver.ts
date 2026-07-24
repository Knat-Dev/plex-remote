import type { Environment } from '../../config/environment.js';
import type { TokenProvider } from '../../config/TokenProvider.js';
import type { Player } from '../../domain/entities/Player.js';
import { PlexHttpClient } from './PlexHttpClient.js';
import { ServerRegistry } from './ServerRegistry.js';
import { CommandSequence } from './CommandSequence.js';
import { plexHeaders, targetHeader } from './plexHeaders.js';

/**
 * Chooses which server relays a given player's companion traffic. A player can
 * register with several servers, but only the one holding its live timeline
 * answers timeline/poll (others return 400). We probe candidates in order and
 * cache the first that responds, so both state reads and commands route through
 * a server that can actually reach the player.
 */
export class RelayResolver {
  #cache = new Map<string, { base: string; at: number }>();
  static readonly #TTL_MS = 120_000;

  constructor(
    private readonly env: Environment,
    private readonly tokens: TokenProvider,
    private readonly http: PlexHttpClient,
    private readonly registry: ServerRegistry,
    private readonly sequence: CommandSequence,
  ) {}

  async resolve(player: Player): Promise<string> {
    const hit = this.#cache.get(player.clientId);
    if (hit && Date.now() - hit.at < RelayResolver.#TTL_MS) return hit.base;

    for (const serverId of player.viaServerIds) {
      const base = await this.registry.baseUrl(serverId);
      if (await this.#answersTimeline(base, player.clientId)) {
        this.#cache.set(player.clientId, { base, at: Date.now() });
        return base;
      }
    }
    // No server answered the timeline probe; fall back to the first candidate
    // so commands (which are more lenient than timeline/poll) can still relay.
    const first = player.viaServerIds[0];
    return first ? this.registry.baseUrl(first) : this.env.primaryServerUrl;
  }

  async #answersTimeline(base: string, clientId: string): Promise<boolean> {
    try {
      const token = await this.tokens.get();
      const res = await this.http.raw(`${base}/player/timeline/poll`, {
        headers: { ...plexHeaders(this.env, token), ...targetHeader(clientId) },
        query: { wait: 0, commandID: this.sequence.next() },
        timeoutMs: 3000,
        retries: 0,
      });
      await res.body?.cancel().catch(() => undefined);
      return res.ok;
    } catch {
      return false;
    }
  }
}
