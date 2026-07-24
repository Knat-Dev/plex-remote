import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { CastSheet, type CastDecision } from './CastSheet.tsx';
import { useCast, usePlaybackState, usePlayers } from '../../api/queries.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';
import type { MediaItemDto } from '../../api/types.ts';

/**
 * The complete "tap an item" behaviour, shared by every browsing surface:
 * browsables navigate deeper (pushed route, so hardware back works);
 * playables cast — guarded by a replace confirmation when the player is
 * mid-watch, and a resume-or-start-over choice when the item is partially
 * watched (Plex semantics). Returns the tap handler plus the sheet to render.
 */
export function useCastFlow() {
  const navigate = useNavigate();
  const { activeClientId, setNowPlaying } = usePlayerStore();
  const { data: players } = usePlayers();
  const { data: playbackState } = usePlaybackState(activeClientId);
  const cast = useCast(activeClientId);
  const [decision, setDecision] = useState<CastDecision>();

  const activePlayerName = players?.find((p) => p.clientId === activeClientId)?.name;

  const doCast = (item: MediaItemDto, offsetMs: number) => {
    setDecision(undefined);
    cast.mutate(
      { serverId: item.serverId, ratingKey: item.ratingKey, mediaType: item.type, offsetMs },
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

  /** Resume decision, entered directly or after the replace step. */
  const proceed = (item: MediaItemDto) => {
    if ((item.progressMs ?? 0) > 0) {
      setDecision({ step: 'resume', item });
      return;
    }
    doCast(item, 0);
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
      setDecision({ step: 'replace', item });
      return;
    }
    proceed(item);
  };

  const drawer = (
    <CastSheet
      decision={decision}
      playerName={activePlayerName}
      onCast={doCast}
      onReplaceConfirmed={proceed}
      onClose={() => setDecision(undefined)}
    />
  );

  return { open, drawer };
}
