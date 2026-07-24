import type { Player } from '../../domain/entities/Player.js';
import type { DiscoverPlayers } from '../usecases/DiscoverPlayers.js';

type Listener = (players: Player[]) => void;

/**
 * Watches player registrations across all servers and notifies listeners the
 * moment the set changes (a player app opening or closing registers/expires
 * on its PMS within seconds). The Plex companion relay has no push channel
 * for registrations, so the backend polls the servers over the LAN — cheaply
 * and invisibly — while every UI client gets pure socket pushes.
 * Runs only while someone is listening.
 */
export class PlayersWatcher {
  #listeners = new Set<Listener>();
  #snapshot: Player[] = [];
  #fingerprint = '';
  #timer: NodeJS.Timeout | undefined;
  #running = false;

  constructor(
    private readonly discover: DiscoverPlayers,
    private readonly intervalMs = 3000,
  ) {}

  snapshot(): Player[] {
    return this.#snapshot;
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    this.#ensureRunning();
    return () => {
      this.#listeners.delete(listener);
      if (this.#listeners.size === 0) this.#stop();
    };
  }

  #ensureRunning(): void {
    if (this.#running) return;
    this.#running = true;
    void this.#tick();
  }

  #stop(): void {
    this.#running = false;
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  async #tick(): Promise<void> {
    if (!this.#running) return;
    try {
      const players = await this.discover.execute();
      const fingerprint = players
        .map((p) => `${p.clientId}:${p.name}`)
        .sort()
        .join('|');
      if (fingerprint !== this.#fingerprint) {
        this.#fingerprint = fingerprint;
        this.#snapshot = players;
        this.#listeners.forEach((listener) => listener(players));
      }
    } catch {
      // Transient discovery failure: keep the last snapshot, try again.
    }
    if (this.#running) {
      this.#timer = setTimeout(() => void this.#tick(), this.intervalMs);
    }
  }
}
