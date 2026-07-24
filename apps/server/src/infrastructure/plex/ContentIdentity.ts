import type { TokenProvider } from '../../config/TokenProvider.js';
import type { HomeUser, HomeUserService } from './HomeUserService.js';

/**
 * The identity content is read as. A single active home user per instance
 * (a household remote), defaulting to the admin/owner. Resolves a per-server
 * token so every content query reflects that user's own watch state. The
 * content gateway depends on this instead of the raw admin token.
 */
export class ContentIdentity {
  #activeUuid: string | undefined; // undefined ⇒ admin/owner
  #adminUuid: string | undefined;

  constructor(
    private readonly admin: TokenProvider,
    private readonly users: HomeUserService,
  ) {}

  /** Token to use for content on `serverId`, honoring the active user. */
  async tokenForServer(serverId: string): Promise<string> {
    if (!this.#activeUuid) return this.admin.get();
    return this.users.serverToken(this.#activeUuid, serverId);
  }

  async list(): Promise<{ users: HomeUser[]; activeUuid: string | undefined }> {
    const users = await this.users.listUsers();
    this.#adminUuid = users.find((u) => u.admin)?.uuid;
    return { users, activeUuid: this.#activeUuid ?? this.#adminUuid };
  }

  /** Select the active user; the admin's uuid (or undefined) means owner. */
  async setActive(uuid: string): Promise<void> {
    if (!this.#adminUuid) await this.list(); // learn admin uuid
    this.#activeUuid = uuid === this.#adminUuid ? undefined : uuid;
  }
}
