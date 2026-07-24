import { useActivePlayer } from '../hooks/useActivePlayer.ts';
import { usePlayerStore } from '../state/usePlayerStore.ts';
import { PauseIcon, PlayIcon } from '../ui/icons.tsx';
import { IconButton } from '../ui/atoms.tsx';

interface NowPlayingBarProps {
  onOpen: () => void;
}

/**
 * Persistent mini-player above the tab bar: artwork, title, progress hairline
 * and play/pause. Tapping it opens the full Remote. Hidden when idle.
 */
export function NowPlayingBar({ onOpen }: NowPlayingBarProps) {
  const { player, state, commands } = useActivePlayer();
  const { nowPlaying } = usePlayerStore();

  const active = state && state.status !== 'stopped';
  if (!active || !player) return null;

  const playing = state.status === 'playing' || state.status === 'buffering';
  const progress = state.durationMs > 0 ? (state.timeMs / state.durationMs) * 100 : 0;
  const meta = nowPlaying?.ratingKey === state.ratingKey ? nowPlaying : undefined;
  const title = meta?.title ?? 'Now playing';
  const thumb = meta?.thumbUrl ?? null;

  return (
    <div className="sticky bottom-[3.6rem] z-30 mx-2 mb-1 overflow-hidden rounded-xl bg-[var(--color-surface-2)]/95 shadow-lg ring-1 ring-[var(--color-border)] backdrop-blur">
      <button onClick={onOpen} className="flex w-full items-center gap-3 p-2 pr-3 text-left">
        {thumb ? (
          <img src={thumb} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="h-11 w-11 shrink-0 rounded-lg bg-[var(--color-surface)]" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-[var(--color-muted)]">on {player.name}</p>
        </div>
        <IconButton
          size={40}
          variant="brand"
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={(e) => {
            e.stopPropagation();
            commands.playback.mutate(playing ? 'pause' : 'play');
          }}
        >
          {playing ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
        </IconButton>
      </button>
      <div className="h-0.5 bg-[var(--color-border)]">
        <div
          className="h-full bg-[var(--color-brand)] transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
