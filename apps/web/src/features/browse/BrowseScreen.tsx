import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChipRow } from '../../components/ChipRow.tsx';
import { PosterGrid } from '../../components/PosterGrid.tsx';
import { PosterSkeleton } from '../../components/PosterSkeleton.tsx';
import { CastConfirmDrawer } from './CastConfirmDrawer.tsx';
import { SearchBar } from './SearchBar.tsx';
import {
  useCast,
  useChildren,
  usePlaybackState,
  usePlayers,
  useSearch,
  useSectionItems,
  useSections,
  useServers,
} from '../../api/queries.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';
import type { MediaItemDto } from '../../api/types.ts';

interface Frame {
  ratingKey: string;
  title: string;
}

interface BrowseScreenProps {
  onCasted: () => void;
}

export function BrowseScreen({ onCasted }: BrowseScreenProps) {
  const { data: servers } = useServers();
  const { activeServerId, setActiveServer, activeClientId, setNowPlaying } = usePlayerStore();
  const { data: players } = usePlayers();
  const serverId = activeServerId ?? servers?.[0]?.id;

  const { data: sections } = useSections(serverId);
  const [sectionKey, setSectionKey] = useState<string>();
  const [stack, setStack] = useState<Frame[]>([]);
  const [query, setQuery] = useState('');
  const [pendingCast, setPendingCast] = useState<MediaItemDto>();

  const activeSection = sectionKey ?? sections?.[0]?.key;
  useEffect(() => setStack([]), [activeSection, serverId]);

  const top = stack[stack.length - 1];
  const sectionQuery = useSectionItems(serverId, top ? undefined : activeSection);
  const childrenQuery = useChildren(serverId, top?.ratingKey);
  const searchQuery = useSearch(serverId, query);
  const { data: playbackState } = usePlaybackState(activeClientId);

  const cast = useCast(activeClientId);
  const activePlayerName = players?.find((p) => p.clientId === activeClientId)?.name;

  const list = query ? searchQuery : top ? childrenQuery : sectionQuery;

  const doCast = (item: MediaItemDto) => {
    if (!serverId) return;
    cast.mutate(
      { serverId, ratingKey: item.ratingKey, mediaType: item.type },
      {
        onSuccess: () => {
          setNowPlaying({
            ratingKey: item.ratingKey,
            title: item.title,
            thumbUrl: item.thumbUrl,
            artUrl: item.artUrl,
          });
          toast(`Casting “${item.title}” to ${activePlayerName ?? 'player'}`);
          onCasted();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Cast failed'),
      },
    );
  };

  const open = (item: MediaItemDto) => {
    if (item.browsable) {
      setStack((prev) => [...prev, { ratingKey: item.ratingKey, title: item.title }]);
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

  const serverChips = useMemo(
    () => (servers ?? []).map((s) => ({ id: s.id, label: s.name })),
    [servers],
  );
  const sectionChips = useMemo(
    () => (sections ?? []).map((s) => ({ id: s.key, label: s.title })),
    [sections],
  );

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <SearchBar value={query} onChange={setQuery} />

      {!query && serverChips.length > 1 && (
        <ChipRow chips={serverChips} activeId={serverId} onSelect={setActiveServer} />
      )}

      {!query && !top && (
        <ChipRow chips={sectionChips} activeId={activeSection} onSelect={setSectionKey} />
      )}

      {!query && top && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setStack((prev) => prev.slice(0, -1))}
          className="self-start rounded-full"
        >
          <ChevronLeft className="size-4" />
          {top.title}
        </Button>
      )}

      {list.isLoading ? (
        <PosterSkeleton />
      ) : !list.data || list.data.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {query ? 'No results' : 'Nothing here'}
        </p>
      ) : (
        <PosterGrid items={list.data} onOpen={open} />
      )}

      <CastConfirmDrawer
        item={pendingCast}
        playerName={activePlayerName}
        onConfirm={(item) => {
          setPendingCast(undefined);
          doCast(item);
        }}
        onClose={() => setPendingCast(undefined)}
      />
    </div>
  );
}
