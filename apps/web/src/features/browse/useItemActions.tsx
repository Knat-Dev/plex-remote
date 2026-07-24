import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ItemActionSheet } from './ItemActionSheet.tsx';
import { useCast, usePlaybackState, usePlayers, useSetWatched } from '../../api/queries.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';
import type { MediaItemDto } from '../../api/types.ts';

/**
 * The interaction model for any browsable surface:
 * - tap a browsable → drill in (pushed route, hardware back works)
 * - tap a playable → quick play (Resume if in-progress, else Watch)
 * - long-press anything → the context-aware action sheet
 *
 * Casting confirms before replacing an active session. Returns the tap and
 * long-press handlers plus the sheet element to render.
 */
export function useItemActions() {
  const navigate = useNavigate();
  const { activeClientId, setNowPlaying } = usePlayerStore();
  const { data: players } = usePlayers();
  const { data: playbackState } = usePlaybackState(activeClientId);
  const cast = useCast(activeClientId);
  const setWatched = useSetWatched();

  const [sheetItem, setSheetItem] = useState<MediaItemDto>();
  const [pendingReplace, setPendingReplace] = useState<{ item: MediaItemDto; offsetMs: number }>();

  const activePlayerName = players?.find((p) => p.clientId === activeClientId)?.name;

  const drill = (item: MediaItemDto) =>
    void navigate({
      to: '/browse/$serverId/$ratingKey',
      params: { serverId: item.serverId, ratingKey: item.ratingKey },
      search: { t: item.title },
    });

  const doCast = (item: MediaItemDto, offsetMs: number) => {
    setSheetItem(undefined);
    setPendingReplace(undefined);
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

  const watch = (item: MediaItemDto, offsetMs: number) => {
    if (!activeClientId) {
      toast.error('Pick a player first');
      return;
    }
    const busy = playbackState && playbackState.status !== 'stopped';
    if (busy && playbackState.ratingKey !== item.ratingKey) {
      setSheetItem(undefined);
      setPendingReplace({ item, offsetMs });
      return;
    }
    doCast(item, offsetMs);
  };

  const markWatched = (item: MediaItemDto, watched: boolean) => {
    setSheetItem(undefined);
    setWatched.mutate(
      { serverId: item.serverId, ratingKey: item.ratingKey, watched },
      {
        onSuccess: () =>
          toast(`Marked “${item.title}” as ${watched ? 'watched' : 'unwatched'}`),
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed'),
      },
    );
  };

  // Tap: drill into containers, quick-play leaves.
  const open = (item: MediaItemDto) => {
    if (item.browsable) drill(item);
    else watch(item, item.progressMs ?? 0);
  };

  const longPress = (item: MediaItemDto) => setSheetItem(item);

  const drawer = (
    <>
      <ItemActionSheet
        item={sheetItem}
        replacePrompt={false}
        onWatch={watch}
        onOpen={drill}
        onMarkWatched={markWatched}
        onClose={() => setSheetItem(undefined)}
      />
      <ReplaceConfirm
        pending={pendingReplace}
        playerName={activePlayerName}
        onConfirm={(item, offsetMs) => doCast(item, offsetMs)}
        onClose={() => setPendingReplace(undefined)}
      />
    </>
  );

  return { open, longPress, drawer };
}

/** Confirm replacing whatever is currently playing before casting. */
function ReplaceConfirm({
  pending,
  playerName,
  onConfirm,
  onClose,
}: {
  pending: { item: MediaItemDto; offsetMs: number } | undefined;
  playerName: string | undefined;
  onConfirm: (item: MediaItemDto, offsetMs: number) => void;
  onClose: () => void;
}) {
  return (
    <Drawer open={Boolean(pending)} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {pending && (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle className="line-clamp-2">{pending.item.title}</DrawerTitle>
              <DrawerDescription>
                {playerName ?? 'The player'} is already playing something. Replace it?
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="safe-bottom">
              <Button size="lg" onClick={() => onConfirm(pending.item, pending.offsetMs)}>
                Play now
              </Button>
              <Button variant="secondary" size="lg" onClick={onClose}>
                Keep watching
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
