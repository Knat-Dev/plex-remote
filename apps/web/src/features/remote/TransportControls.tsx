import type { ReactNode } from 'react';
import type { PlaybackCommandDto, PlaybackStateDto } from '../../api/types.ts';
import { NextIcon, PauseIcon, PlayIcon, PrevIcon, StopIcon } from '../../ui/icons.tsx';

interface TransportControlsProps {
  status: PlaybackStateDto['status'];
  onCommand: (command: PlaybackCommandDto) => void;
}

export function TransportControls({ status, onCommand }: TransportControlsProps) {
  const isPlaying = status === 'playing';
  return (
    <div className="flex items-center justify-center gap-3">
      <RoundButton onClick={() => onCommand('skipPrevious')} aria-label="Previous">
        <PrevIcon width={22} height={22} />
      </RoundButton>
      <RoundButton onClick={() => onCommand('stepBack')} aria-label="Rewind" small>
        <span className="text-xs font-semibold">-10</span>
      </RoundButton>
      <button
        onClick={() => onCommand(isPlaying ? 'pause' : 'play')}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand)] text-black shadow-lg transition active:scale-95"
      >
        {isPlaying ? <PauseIcon width={28} height={28} /> : <PlayIcon width={28} height={28} />}
      </button>
      <RoundButton onClick={() => onCommand('stepForward')} aria-label="Forward" small>
        <span className="text-xs font-semibold">+10</span>
      </RoundButton>
      <RoundButton onClick={() => onCommand('skipNext')} aria-label="Next">
        <NextIcon width={22} height={22} />
      </RoundButton>
    </div>
  );
}

export function StopButton({ onCommand }: { onCommand: (c: PlaybackCommandDto) => void }) {
  return (
    <button
      onClick={() => onCommand('stop')}
      className="mx-auto flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] px-4 py-2 text-sm text-[var(--color-muted)] ring-1 ring-[var(--color-border)] active:scale-95"
    >
      <StopIcon width={16} height={16} /> Stop
    </button>
  );
}

function RoundButton({
  children,
  onClick,
  small,
  ...rest
}: {
  children: ReactNode;
  onClick: () => void;
  small?: boolean;
  'aria-label': string;
}) {
  return (
    <button
      onClick={onClick}
      {...rest}
      className={`flex items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text)] ring-1 ring-[var(--color-border)] transition active:scale-95 ${
        small ? 'h-11 w-11' : 'h-13 w-13 p-3'
      }`}
    >
      {children}
    </button>
  );
}
