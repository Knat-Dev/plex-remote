import type { Player } from '../entities/Player.js';
import type { PlaybackState } from '../entities/PlaybackState.js';

/**
 * Write-side control of a single player using the Plex companion command API.
 * All routing (which server relays the command) is an implementation concern.
 */
export interface PlayerController {
  /** Build a play queue for `request.ratingKey` and start it on the player. */
  cast(player: Player, request: CastRequest): Promise<void>;
  playback(player: Player, command: PlaybackCommand): Promise<void>;
  navigate(player: Player, action: NavigationAction): Promise<void>;
  setVolume(player: Player, level: number): Promise<void>;
  seek(player: Player, offsetMs: number): Promise<void>;
  getState(player: Player): Promise<PlaybackState>;
}

export type MediaKind = 'video' | 'audio' | 'photo';

export interface CastRequest {
  readonly serverId: string;
  readonly ratingKey: string;
  readonly kind: MediaKind;
}

export type PlaybackCommand =
  | 'play'
  | 'pause'
  | 'stop'
  | 'skipNext'
  | 'skipPrevious'
  | 'stepForward'
  | 'stepBack';

export type NavigationAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'select'
  | 'back'
  | 'home';
