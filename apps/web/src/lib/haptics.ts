/**
 * A short haptic tick for a recognised gesture (e.g. a long-press opening the
 * action sheet). Uses the Vibration API, supported on Android/Chromium PWAs.
 *
 * iOS Safari does NOT implement navigator.vibrate — Apple exposes no web
 * haptics API for PWAs — so on iPhone this is a graceful no-op, never an error.
 */
export function haptic(pattern: number | number[] = 8): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported — no-op */
  }
}
