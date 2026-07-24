import { Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivePlayer } from '../hooks/useActivePlayer.ts';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  onLogo: () => void;
  onOpenPlayers: () => void;
}

/** Sticky title bar; logo returns to Browse, live player chip opens Players. */
export function AppHeader({ onLogo, onOpenPlayers }: AppHeaderProps) {
  const { player, state } = useActivePlayer();
  const playing = state?.status === 'playing' || state?.status === 'buffering';

  return (
    <header className="safe-top sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 pb-3 backdrop-blur">
      <button onClick={onLogo} className="flex items-baseline gap-1" aria-label="Go to Browse">
        <span className="text-lg font-bold tracking-tight">Plex</span>
        <span className="text-lg font-bold tracking-tight text-primary">Remote</span>
      </button>
      <Button variant="secondary" size="sm" onClick={onOpenPlayers} className="rounded-full">
        <span className={cn('relative flex size-2', !playing && 'opacity-40')}>
          {playing && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          )}
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <Tv className="size-4 text-muted-foreground" />
        <span className="max-w-28 truncate">{player?.name ?? 'No player'}</span>
      </Button>
    </header>
  );
}
