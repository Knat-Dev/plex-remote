import type { NavigationActionDto } from '../../api/types.ts';
import { BackIcon, ChevronIcon, HomeIcon } from '../../ui/icons.tsx';

interface DPadProps {
  onNavigate: (action: NavigationActionDto) => void;
}

/** On-screen directional pad for controlling the player's UI. */
export function DPad({ onNavigate }: DPadProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-48 w-48 rounded-full bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]">
        <Arrow className="left-1/2 top-2 -translate-x-1/2 -rotate-90" onClick={() => onNavigate('moveUp')} label="Up" />
        <Arrow className="left-1/2 bottom-2 -translate-x-1/2 rotate-90" onClick={() => onNavigate('moveDown')} label="Down" />
        <Arrow className="left-2 top-1/2 -translate-y-1/2 rotate-180" onClick={() => onNavigate('moveLeft')} label="Left" />
        <Arrow className="right-2 top-1/2 -translate-y-1/2" onClick={() => onNavigate('moveRight')} label="Right" />
        <button
          onClick={() => onNavigate('select')}
          aria-label="Select"
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-brand)] text-sm font-semibold text-black shadow-lg transition active:scale-95"
        >
          OK
        </button>
      </div>
      <div className="flex gap-3">
        <Pill onClick={() => onNavigate('back')} label="Back">
          <BackIcon width={18} height={18} />
        </Pill>
        <Pill onClick={() => onNavigate('home')} label="Home">
          <HomeIcon width={18} height={18} />
        </Pill>
      </div>
    </div>
  );
}

function Arrow({ className, onClick, label }: { className: string; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`absolute flex h-12 w-12 items-center justify-center text-[var(--color-muted)] transition active:text-[var(--color-brand)] ${className}`}
    >
      <ChevronIcon width={26} height={26} />
    </button>
  );
}

function Pill({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] px-4 py-2 text-sm ring-1 ring-[var(--color-border)] active:scale-95"
    >
      {children} {label}
    </button>
  );
}
