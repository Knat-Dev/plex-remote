import { Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PlaybackCommandDto, PlaybackStateDto } from '../../api/types.ts';

interface TransportControlsProps {
  status: PlaybackStateDto['status'];
  onCommand: (command: PlaybackCommandDto) => void;
}

export function TransportControls({ status, onCommand }: TransportControlsProps) {
  const isPlaying = status === 'playing';
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        size="icon-lg"
        aria-label="Previous"
        className="rounded-full"
        onClick={() => onCommand('skipPrevious')}
      >
        <SkipBack className="size-5" />
      </Button>
      <Button
        variant="secondary"
        size="icon-lg"
        aria-label="Back 10 seconds"
        className="rounded-full"
        onClick={() => onCommand('stepBack')}
      >
        <RotateCcw className="size-5" />
      </Button>
      <Button
        size="icon-lg"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="size-16 rounded-full shadow-lg"
        onClick={() => onCommand(isPlaying ? 'pause' : 'play')}
      >
        {isPlaying ? <Pause className="size-7" /> : <Play className="size-7" />}
      </Button>
      <Button
        variant="secondary"
        size="icon-lg"
        aria-label="Forward 10 seconds"
        className="rounded-full"
        onClick={() => onCommand('stepForward')}
      >
        <RotateCw className="size-5" />
      </Button>
      <Button
        variant="secondary"
        size="icon-lg"
        aria-label="Next"
        className="rounded-full"
        onClick={() => onCommand('skipNext')}
      >
        <SkipForward className="size-5" />
      </Button>
    </div>
  );
}

export function StopButton({ onCommand }: { onCommand: (c: PlaybackCommandDto) => void }) {
  return (
    <Button
      variant="secondary"
      onClick={() => onCommand('stop')}
      className="mx-auto rounded-full text-muted-foreground"
    >
      <Square className="size-4" /> Stop
    </Button>
  );
}
