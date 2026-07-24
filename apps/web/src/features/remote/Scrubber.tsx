import { useEffect, useState } from 'react';
import { formatTime } from '../../util/format.ts';

interface ScrubberProps {
  timeMs: number;
  durationMs: number;
  onSeek: (offsetMs: number) => void;
}

/**
 * Seek bar that follows live playback but yields to the user while dragging,
 * committing the seek only on release (avoids fighting the 1s state poll).
 */
export function Scrubber({ timeMs, durationMs, onSeek }: ScrubberProps) {
  const [dragging, setDragging] = useState(false);
  const [value, setValue] = useState(timeMs);

  useEffect(() => {
    if (!dragging) setValue(timeMs);
  }, [timeMs, dragging]);

  const max = Math.max(durationMs, 1);

  return (
    <div className="flex flex-col gap-1">
      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(value, max)}
        onChange={(e) => {
          setDragging(true);
          setValue(Number(e.target.value));
        }}
        onPointerUp={() => {
          setDragging(false);
          onSeek(value);
        }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-border)] accent-[var(--color-brand)]"
        style={{
          background: `linear-gradient(to right, var(--color-brand) ${(value / max) * 100}%, var(--color-border) ${(value / max) * 100}%)`,
        }}
      />
      <div className="flex justify-between text-xs tabular-nums text-[var(--color-muted)]">
        <span>{formatTime(value)}</span>
        <span>{formatTime(durationMs)}</span>
      </div>
    </div>
  );
}
