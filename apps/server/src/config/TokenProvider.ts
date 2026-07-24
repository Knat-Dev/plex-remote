import { readFile } from 'node:fs/promises';
import type { Environment } from './environment.js';

/**
 * Resolves the Plex auth token from an explicit env var or, failing that,
 * the server's Preferences.xml. The value is cached in memory and never logged.
 */
export class TokenProvider {
  #cached: string | undefined;

  constructor(private readonly env: Environment) {
    this.#cached = env.explicitToken;
  }

  async get(): Promise<string> {
    if (this.#cached) return this.#cached;
    const token = await this.#readFromPreferences();
    if (!token) {
      throw new Error(
        'No Plex token available: set PLEX_TOKEN or ensure PLEX_PREFERENCES_PATH is readable.',
      );
    }
    this.#cached = token;
    return token;
  }

  async #readFromPreferences(): Promise<string | undefined> {
    let xml: string;
    try {
      xml = await readFile(this.env.preferencesPath, 'utf8');
    } catch {
      return undefined;
    }
    return /PlexOnlineToken="([^"]+)"/.exec(xml)?.[1];
  }
}
