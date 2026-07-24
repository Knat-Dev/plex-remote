import { useEffect, useState } from 'react';
import { Slider } from '@/components/ui/slider';
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
    <div className="flex flex-col gap-2">
      <Slider
        min={0}
        max={max}
        step={1000}
        value={[Math.min(value, max)]}
        onValueChange={([v]) => {
          setDragging(true);
          setValue(v ?? 0);
        }}
        onValueCommit={([v]) => {
          setDragging(false);
          onSeek(v ?? 0);
        }}
      />
      <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{formatTime(value)}</span>
        <span>{formatTime(durationMs)}</span>
      </div>
    </div>
  );
}
