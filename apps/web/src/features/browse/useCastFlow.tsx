import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { CastConfirmDrawer } from './CastConfirmDrawer.tsx';
import { useCast, usePlaybackState, usePlayers } from '../../api/queries.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';
import type { MediaItemDto } from '../../api/types.ts';

/**
 * The complete "tap an item" behaviour, shared by every browsing surface:
 * browsables navigate deeper (pushed route, so hardware back works), playables
 * cast — guarded by a confirmation drawer when the player is mid-watch.
 * Returns the tap handler plus the drawer element to render.
 */
export function useCastFlow() {
  const navigate = useNavigate();
  const { activeClientId, setNowPlaying } = usePlayerStore();
  const { data: players } = usePlayers();
  const { data: playbackState } = usePlaybackState(activeClientId);
  const cast = useCast(activeClientId);
  const [pendingCast, setPendingCast] = useState<MediaItemDto>();

  const activePlayerName = players?.find((p) => p.clientId === activeClientId)?.name;

  const doCast = (item: MediaItemDto) => {
    cast.mutate(
      { serverId: item.serverId, ratingKey: item.ratingKey, mediaType: item.type },
      {
        onSuccess: () => {
          setNowPlaying({
            ratingKey: item.ratingKey,
            title: item.title,
            thumbUrl: item.thumbUrl,
            artUrl: item.artUrl,
          });
          toast(`Casting “${item.title}” to ${activePlayerName ?? 'player'}`);
          void navigate({ to: '/remote' });
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Cast failed'),
      },
    );
  };

  const open = (item: MediaItemDto) => {
    if (item.browsable) {
      void navigate({
        to: '/browse/$serverId/$ratingKey',
        params: { serverId: item.serverId, ratingKey: item.ratingKey },
        search: { t: item.title },
      });
      return;
    }
    if (!activeClientId) {
      toast.error('Pick a player first');
      return;
    }
    // Mid-watch protection: replacing active playback needs explicit consent.
    const busy = playbackState && playbackState.status !== 'stopped';
    if (busy && playbackState.ratingKey !== item.ratingKey) {
      setPendingCast(item);
      return;
    }
    doCast(item);
  };

  const drawer = (
    <CastConfirmDrawer
      item={pendingCast}
      playerName={activePlayerName}
      onConfirm={(item) => {
        setPendingCast(undefined);
        doCast(item);
      }}
      onClose={() => setPendingCast(undefined)}
    />
  );

  return { open, drawer };
}
