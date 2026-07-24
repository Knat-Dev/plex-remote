import { Link } from '@tanstack/react-router';
import { Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivePlayer } from '../hooks/useActivePlayer.ts';
import { cn } from '@/lib/utils';

/** Sticky title bar; logo returns to Browse, live player chip opens Players. */
export function AppHeader() {
  const { player, state } = useActivePlayer();
  const playing = state?.status === 'playing' || state?.status === 'buffering';

  return (
    <header className="safe-top z-40 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 pb-3 backdrop-blur">
      <Link to="/" className="flex items-baseline gap-1" aria-label="Go to Browse">
        <span className="text-lg font-bold tracking-tight">Plex</span>
        <span className="text-lg font-bold tracking-tight text-primary">Remote</span>
      </Link>
      <Button variant="secondary" size="sm" asChild className="rounded-full">
        <Link to="/players">
          <span className={cn('relative flex size-2', !playing && 'opacity-40')}>
            {playing && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            )}
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <Tv className="size-4 text-muted-foreground" />
          <span className="max-w-28 truncate">{player?.name ?? 'No player'}</span>
        </Link>
      </Button>
    </header>
  );
}
