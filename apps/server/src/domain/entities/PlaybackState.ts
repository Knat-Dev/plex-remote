/**
 * A snapshot of what a player is currently doing, derived from the timeline.
 */
export type PlaybackStatus = 'playing' | 'paused' | 'buffering' | 'stopped';

/** Plex's command vocabulary for which timeline a command addresses. */
export type TimelineType = 'video' | 'music' | 'photo';

export interface PlaybackState {
  readonly status: PlaybackStatus;
  /** Which timeline is active — required on transport commands or players ignore them. */
  readonly mediaType?: TimelineType;
  readonly ratingKey?: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly thumb?: string;
  readonly timeMs: number;
  readonly durationMs: number;
  readonly volume?: number;
  readonly muted: boolean;
  readonly repeat?: boolean;
  readonly shuffle?: boolean;
}

export const IDLE_STATE: PlaybackState = {
  status: 'stopped',
  timeMs: 0,
  durationMs: 0,
  muted: false,
};
