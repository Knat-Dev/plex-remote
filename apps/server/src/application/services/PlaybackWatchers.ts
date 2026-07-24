import type { PlaybackState } from '../../domain/entities/PlaybackState.js';
import type { ControlPlayback } from '../usecases/ControlPlayback.js';

type Listener = (state: PlaybackState) => void;

interface Watch {
  listeners: Set<Listener>;
  timer: NodeJS.Timeout | undefined;
  running: boolean;
  lastJson: string;
}

/**
 * Per-player playback-state watchers, ref-counted: a player's timeline is
 * relayed by its PMS only via polling (the companion protocol has no push),
 * so the backend polls each WATCHED player once a second and pushes changes
 * to every subscribed socket. No subscribers ⇒ no polling.
 */
export class PlaybackWatchers {
  #watches = new Map<string, Watch>();

  constructor(
    private readonly control: ControlPlayback,
    private readonly intervalMs = 1000,
  ) {}

  watch(clientId: string, listener: Listener): () => void {
    let watch = this.#watches.get(clientId);
    if (!watch) {
      watch = { listeners: new Set(), timer: undefined, running: false, lastJson: '' };
      this.#watches.set(clientId, watch);
    }
    watch.listeners.add(listener);
    this.#ensureRunning(clientId, watch);
    return () => {
      watch.listeners.delete(listener);
      if (watch.listeners.size === 0) {
        watch.running = false;
        clearTimeout(watch.timer);
        this.#watches.delete(clientId);
      }
    };
  }

  #ensureRunning(clientId: string, watch: Watch): void {
    if (watch.running) return;
    watch.running = true;
    void this.#tick(clientId, watch);
  }

  async #tick(clientId: string, watch: Watch): Promise<void> {
    if (!watch.running) return;
    try {
      const state = await this.control.state(clientId);
      const json = JSON.stringify(state);
      if (json !== watch.lastJson) {
        watch.lastJson = json;
        watch.listeners.forEach((listener) => listener(state));
      }
    } catch {
      // Player unreachable this tick (e.g. mid-restart); keep watching.
    }
    if (watch.running) {
      watch.timer = setTimeout(() => void this.#tick(clientId, watch), this.intervalMs);
    }
  }
}
