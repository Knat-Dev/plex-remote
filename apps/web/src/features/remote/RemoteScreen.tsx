import { useEffect, useState } from 'react';
import { useActivePlayer } from '../../hooks/useActivePlayer.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';
import { EmptyState } from '../../ui/Spinner.tsx';
import { Segmented } from '../../ui/atoms.tsx';
import { Scrubber } from './Scrubber.tsx';
import { StopButton, TransportControls } from './TransportControls.tsx';
import { VolumeSlider } from './VolumeSlider.tsx';
import { DPad } from './DPad.tsx';

type Tab = 'playback' | 'navigate';

export function RemoteScreen() {
  const { clientId: activeClientId, player, state, commands } = useActivePlayer();
  const { nowPlaying } = usePlayerStore();
  const [tab, setTab] = useState<Tab>('playback');

  const [volume, setVolume] = useState(100);
  useEffect(() => {
    if (state?.volume !== undefined) setVolume(state.volume);
  }, [state?.volume]);

  if (!activeClientId || !player) {
    return <EmptyState message="Select a player from the Players tab to begin." />;
  }

  const status = state?.status ?? 'stopped';
  const isIdle = status === 'stopped';
  const art =
    !isIdle && nowPlaying && nowPlaying.ratingKey === state?.ratingKey ? nowPlaying : undefined;

  return (
    <div className="flex flex-col gap-5 px-4 pb-4">
      {art ? (
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-[var(--color-border)]">
          {art.artUrl && (
            <img
              src={art.artUrl}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-sm"
            />
          )}
          <div className="relative flex items-center gap-4 p-4">
            {art.thumbUrl && (
              <img
                src={art.thumbUrl}
                alt=""
                className="h-24 w-16 shrink-0 rounded-lg object-cover shadow-lg"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                {status === 'paused' ? 'Paused on' : 'Playing on'} {player.name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-lg font-semibold leading-tight">
                {art.title}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Now controlling</p>
          <p className="text-lg font-semibold">{player.name}</p>
          <p className="text-sm text-[var(--color-muted)]">{player.product}</p>
        </div>
      )}

      {player.canNavigate && (
        <Segmented options={['playback', 'navigate'] as const} value={tab} onChange={setTab} />
      )}

      {tab === 'playback' || !player.canNavigate ? (
        <div className="flex flex-col gap-5">
          {isIdle ? (
            <EmptyState message="Nothing playing. Pick something from Browse to cast." />
          ) : (
            <Scrubber
              timeMs={state?.timeMs ?? 0}
              durationMs={state?.durationMs ?? 0}
              onSeek={(ms) => commands.seek.mutate(ms)}
            />
          )}
          <TransportControls status={status} onCommand={(c) => commands.playback.mutate(c)} />
          <VolumeSlider
            volume={volume}
            onChange={(v) => {
              setVolume(v);
              commands.volume.mutate(v);
            }}
          />
          {!isIdle && <StopButton onCommand={(c) => commands.playback.mutate(c)} />}
        </div>
      ) : (
        <DPad onNavigate={(a) => commands.navigate.mutate(a)} />
      )}
    </div>
  );
}
