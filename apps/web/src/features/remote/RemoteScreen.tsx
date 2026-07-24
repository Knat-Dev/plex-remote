import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActivePlayer } from '../../hooks/useActivePlayer.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';
import { Scrubber } from './Scrubber.tsx';
import { StopButton, TransportControls } from './TransportControls.tsx';
import { VolumeSlider } from './VolumeSlider.tsx';
import { DPad } from './DPad.tsx';

export function RemoteScreen() {
  const { player, state, commands, isReady } = useActivePlayer();
  const { nowPlaying } = usePlayerStore();

  const [volume, setVolume] = useState(100);
  useEffect(() => {
    if (state?.volume !== undefined) setVolume(state.volume);
  }, [state?.volume]);

  if (!isReady || !player) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Select a player from the Players tab to begin.
      </p>
    );
  }

  const status = state?.status ?? 'stopped';
  const isIdle = status === 'stopped';
  const art =
    !isIdle && nowPlaying && nowPlaying.ratingKey === state?.ratingKey ? nowPlaying : undefined;

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-4">
      {art ? (
        <div className="relative overflow-hidden rounded-xl ring-1 ring-border">
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {status === 'paused' ? 'Paused on' : 'Playing on'} {player.name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-lg font-semibold leading-tight">{art.title}</p>
            </div>
          </div>
        </div>
      ) : (
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Now controlling</p>
            <p className="text-lg font-semibold">{player.name}</p>
            <p className="text-sm text-muted-foreground">{player.product}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="playback" className="flex flex-1 flex-col">
        {player.canNavigate && (
          <TabsList className="w-full rounded-full">
            <TabsTrigger value="playback" className="flex-1 rounded-full">
              Playback
            </TabsTrigger>
            <TabsTrigger value="navigate" className="flex-1 rounded-full">
              Navigate
            </TabsTrigger>
          </TabsList>
        )}

        {/* justify-evenly distributes the controls over the full remaining
            height — a remote should fill the hand, not top-stack. */}
        <TabsContent value="playback" className="flex flex-1 flex-col justify-evenly gap-4 py-2">
          {isIdle ? (
            <p className="text-center text-sm text-muted-foreground">
              Nothing playing. Pick something from Browse to cast.
            </p>
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
        </TabsContent>

        <TabsContent value="navigate" className="flex flex-1 items-center justify-center">
          <DPad onNavigate={(a) => commands.navigate.mutate(a)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
