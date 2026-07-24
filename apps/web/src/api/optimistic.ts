import type { PlaybackCommandDto, PlaybackStateDto } from './types.ts';

/**
 * Optimistic playback: the UI reflects a command the instant it is sent, and
 * the 1s timeline poll reconciles with the player's real state afterwards.
 * Pure functions here compute the predicted state; `pollHold` keeps the poll
 * from overwriting the prediction with a stale reading while the player is
 * still reacting (~1-2s through the relay).
 */

export function predictPlayback(
  state: PlaybackStateDto,
  command: PlaybackCommandDto,
): PlaybackStateDto {
  switch (command) {
    case 'pause':
      return { ...state, status: 'paused' };
    case 'play':
      return { ...state, status: 'playing' };
    case 'stop':
      return { status: 'stopped', timeMs: 0, durationMs: 0, muted: false };
    case 'stepForward':
      return { ...state, timeMs: clampTime(state, state.timeMs + 10_000) };
    case 'stepBack':
      return { ...state, timeMs: clampTime(state, state.timeMs - 10_000) };
    case 'skipNext':
    case 'skipPrevious':
      return { ...state, status: 'buffering', timeMs: 0 };
  }
}

export function predictSeek(state: PlaybackStateDto, offsetMs: number): PlaybackStateDto {
  return { ...state, timeMs: clampTime(state, offsetMs) };
}

export function predictVolume(state: PlaybackStateDto, level: number): PlaybackStateDto {
  return { ...state, volume: level };
}

function clampTime(state: PlaybackStateDto, timeMs: number): number {
  return Math.max(0, Math.min(state.durationMs || Number.MAX_SAFE_INTEGER, timeMs));
}

/** Suppresses state polling for a short window after a command. */
const HOLD_MS = 2000;
let holdUntil = 0;

export const pollHold = {
  start(): void {
    holdUntil = Date.now() + HOLD_MS;
  },
  remainingMs(): number {
    return Math.max(0, holdUntil - Date.now());
  },
};
