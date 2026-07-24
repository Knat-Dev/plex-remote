import { useActivePlayer } from '../hooks/useActivePlayer.ts';
import { TvIcon } from '../ui/icons.tsx';

interface AppHeaderProps {
  onOpenPlayers: () => void;
}

/** Sticky title bar with a live "now controlling" chip that jumps to Players. */
export function AppHeader({ onOpenPlayers }: AppHeaderProps) {
  const { player, state } = useActivePlayer();
  const playing = state?.status === 'playing' || state?.status === 'buffering';

  return (
    <header className="safe-top sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-4 pb-3 backdrop-blur">
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold tracking-tight">Plex</span>
        <span className="text-lg font-bold tracking-tight text-[var(--color-brand)]">Remote</span>
      </div>
      <button
        onClick={onOpenPlayers}
        className="flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] py-1.5 pl-2.5 pr-3 text-sm ring-1 ring-[var(--color-border)]"
      >
        <span className={`relative flex h-2 w-2 ${playing ? '' : 'opacity-40'}`}>
          {playing && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-brand)] opacity-75" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-brand)]" />
        </span>
        <TvIcon width={16} height={16} className="text-[var(--color-muted)]" />
        <span className="max-w-28 truncate">{player?.name ?? 'No player'}</span>
      </button>
    </header>
  );
}
