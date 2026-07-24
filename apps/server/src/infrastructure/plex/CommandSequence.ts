/**
 * Monotonic command id source for Plex companion commands, scoped to one
 * controller identity for the life of the process.
 *
 * Plex records the highest commandID seen per client identifier and ignores any
 * transport command that is not strictly greater (a stale, restart-reset counter
 * is why pause/stop silently no-op with a 200). It also parses commandID as a
 * 32-bit int on the timeline/poll path, so a clock-derived seed overflows and
 * yields 400. The robust answer is a *fresh* controller identity each process
 * (see Environment.controllerId) paired with this small, in-process counter:
 * the per-identity high-water mark starts empty, so ids from 1 upward are both
 * accepted and comfortably within int32.
 */
export class CommandSequence {
  #value: number;

  constructor(seed = 0) {
    this.#value = seed;
  }

  next(): number {
    this.#value += 1;
    return this.#value;
  }
}
