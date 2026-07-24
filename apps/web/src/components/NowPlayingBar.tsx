import { useNavigate } from '@tanstack/react-router';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TitleMarquee } from './TitleMarquee.tsx';
import { useActivePlayer } from '../hooks/useActivePlayer.ts';
import { useNowPlayingMeta } from '../hooks/useNowPlayingMeta.ts';

/**
 * Persistent mini-player above the tab bar: artwork, title, progress and
 * play/pause. Tapping it opens the full Remote. Hidden when idle.
 */
export function NowPlayingBar() {
  const navigate = useNavigate();
  const onOpen = () => void navigate({ to: '/remote' });
  const { player, state, commands } = useActivePlayer();
  const meta = useNowPlayingMeta(state);

  const active = state && state.status !== 'stopped';
  if (!active || !player) return null;

  const playing = state.status === 'playing' || state.status === 'buffering';
  const progress = state.durationMs > 0 ? (state.timeMs / state.durationMs) * 100 : 0;

  return (
    <Card className="z-30 mx-2 mb-1.5 shrink-0 gap-0 overflow-hidden rounded-xl bg-secondary/95 p-0 shadow-lg backdrop-blur">
      <button onClick={onOpen} className="flex w-full items-center gap-3 p-2 pr-3 text-left">
        {meta?.thumbUrl ? (
          <img src={meta.thumbUrl} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="size-11 shrink-0 rounded-lg bg-card" />
        )}
        <div className="min-w-0 flex-1">
          <TitleMarquee
            text={meta?.title ?? 'Now playing'}
            className="text-sm font-medium"
            fadeFrom="from-secondary"
          />
          <p className="truncate text-xs text-muted-foreground">on {player.name}</p>
        </div>
        <Button
          size="icon"
          aria-label={playing ? 'Pause' : 'Play'}
          className="rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            commands.playback.mutate(playing ? 'pause' : 'play');
          }}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
      </button>
      <Progress value={progress} className="h-0.5 rounded-none" />
    </Card>
  );
}
