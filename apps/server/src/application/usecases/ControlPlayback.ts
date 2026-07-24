import type {
  NavigationAction,
  PlaybackCommand,
  PlayerController,
} from '../../domain/ports/PlayerController.js';
import type { PlaybackState } from '../../domain/entities/PlaybackState.js';
import type { ResolvePlayer } from './ResolvePlayer.js';

/**
 * All write/read interactions with an already-playing (or idle) player:
 * transport, seek, volume, navigation and state polling.
 */
export class ControlPlayback {
  constructor(
    private readonly resolvePlayer: ResolvePlayer,
    private readonly controller: PlayerController,
  ) {}

  async playback(clientId: string, command: PlaybackCommand): Promise<void> {
    await this.controller.playback(await this.resolvePlayer.execute(clientId), command);
  }

  async navigate(clientId: string, action: NavigationAction): Promise<void> {
    await this.controller.navigate(await this.resolvePlayer.execute(clientId), action);
  }

  async setVolume(clientId: string, level: number): Promise<void> {
    await this.controller.setVolume(await this.resolvePlayer.execute(clientId), level);
  }

  async seek(clientId: string, offsetMs: number): Promise<void> {
    await this.controller.seek(await this.resolvePlayer.execute(clientId), offsetMs);
  }

  async state(clientId: string): Promise<PlaybackState> {
    return this.controller.getState(await this.resolvePlayer.execute(clientId));
  }
}
