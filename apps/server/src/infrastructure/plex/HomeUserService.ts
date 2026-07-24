import type { Environment } from '../../config/environment.js';
import type { TokenProvider } from '../../config/TokenProvider.js';
import { PlexHttpClient } from './PlexHttpClient.js';
import { plexHeaders } from './plexHeaders.js';

export interface HomeUser {
  readonly id: string;
  readonly uuid: string;
  readonly title: string;
  readonly admin: boolean;
  readonly thumb: string | undefined;
}

interface HomeUserDto {
  id: number;
  uuid: string;
  title: string;
  admin: boolean;
  thumb?: string;
}
interface ResourceDto {
  clientIdentifier: string;
  accessToken?: string;
}

/**
 * Plex Home user directory and the token-exchange chain that lets us browse a
 * server AS a given home user (their own watch state / Continue Watching):
 *   switch(uuid) → the user's account authToken
 *   resources(authToken) → the user's PER-SERVER access token
 * The admin's own token already grants direct server access. Both the account
 * token (per user) and the server token (per user+server) are cached; tokens
 * never leave this process.
 */
export class HomeUserService {
  #authTokens = new Map<string, string>(); // uuid -> account authToken
  #serverTokens = new Map<string, string>(); // `${uuid}:${serverId}` -> access token

  constructor(
    private readonly env: Environment,
    private readonly admin: TokenProvider,
    private readonly http: PlexHttpClient,
  ) {}

  async listUsers(): Promise<HomeUser[]> {
    const token = await this.admin.get();
    const data = await this.http.json<{ users?: HomeUserDto[] } | HomeUserDto[]>(
      'https://plex.tv/api/v2/home/users',
      { headers: plexHeaders(this.env, token), timeoutMs: this.env.requestTimeoutMs },
    );
    const users = Array.isArray(data) ? data : (data.users ?? []);
    return users.map((u) => ({
      id: String(u.id),
      uuid: u.uuid,
      title: u.title,
      admin: Boolean(u.admin),
      thumb: u.thumb,
    }));
  }

  /** Per-server access token for a home user; throws if they lack access. */
  async serverToken(uuid: string, serverId: string): Promise<string> {
    const key = `${uuid}:${serverId}`;
    const cached = this.#serverTokens.get(key);
    if (cached) return cached;

    const authToken = await this.#authToken(uuid);
    const resources = await this.http.json<ResourceDto[]>(
      'https://plex.tv/api/v2/resources',
      {
        headers: plexHeaders(this.env, authToken),
        query: { includeHttps: 1 },
        timeoutMs: this.env.requestTimeoutMs,
      },
    );
    const access = resources.find((r) => r.clientIdentifier === serverId)?.accessToken;
    if (!access) throw new Error(`User ${uuid} has no access to server ${serverId}`);
    this.#serverTokens.set(key, access);
    return access;
  }

  async #authToken(uuid: string): Promise<string> {
    const cached = this.#authTokens.get(uuid);
    if (cached) return cached;
    const admin = await this.admin.get();
    const data = await this.http.json<{ authToken?: string }>(
      `https://plex.tv/api/v2/home/users/${uuid}/switch`,
      { method: 'POST', headers: plexHeaders(this.env, admin), timeoutMs: this.env.requestTimeoutMs },
    );
    if (!data.authToken) throw new Error(`Could not switch to user ${uuid}`);
    this.#authTokens.set(uuid, data.authToken);
    return data.authToken;
  }
}
