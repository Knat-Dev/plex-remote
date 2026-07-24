import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CornerUpLeft, House } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoldButton } from '../../components/HoldButton.tsx';
import { cn } from '@/lib/utils';
import type { NavigationActionDto } from '../../api/types.ts';

interface DPadProps {
  onNavigate: (action: NavigationActionDto) => void;
}

/** On-screen directional pad for controlling the player's UI. */
export function DPad({ onNavigate }: DPadProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-48 rounded-full bg-card ring-1 ring-border">
        <Arrow className="left-1/2 top-1 -translate-x-1/2" label="Up" onClick={() => onNavigate('moveUp')}>
          <ChevronUp className="size-6" />
        </Arrow>
        <Arrow className="bottom-1 left-1/2 -translate-x-1/2" label="Down" onClick={() => onNavigate('moveDown')}>
          <ChevronDown className="size-6" />
        </Arrow>
        <Arrow className="left-1 top-1/2 -translate-y-1/2" label="Left" onClick={() => onNavigate('moveLeft')}>
          <ChevronLeft className="size-6" />
        </Arrow>
        <Arrow className="right-1 top-1/2 -translate-y-1/2" label="Right" onClick={() => onNavigate('moveRight')}>
          <ChevronRight className="size-6" />
        </Arrow>
        <Button
          aria-label="Select"
          onClick={() => onNavigate('select')}
          className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full text-sm font-semibold shadow-lg"
        >
          OK
        </Button>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" className="rounded-full" onClick={() => onNavigate('back')}>
          <CornerUpLeft className="size-4" /> Back
        </Button>
        <Button variant="secondary" className="rounded-full" onClick={() => onNavigate('home')}>
          <House className="size-4" /> Home
        </Button>
      </div>
    </div>
  );
}

function Arrow({
  className,
  label,
  onClick,
  children,
}: {
  className: string;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <HoldButton
      variant="ghost"
      size="icon-lg"
      aria-label={label}
      onTrigger={onClick}
      className={cn('absolute rounded-full text-muted-foreground active:text-primary', className)}
    >
      {children}
    </HoldButton>
  );
}
