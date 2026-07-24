import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChipRow } from '../../components/ChipRow.tsx';
import { VirtualPosterGrid } from '../../components/VirtualPosterGrid.tsx';
import { PosterSkeleton } from '../../components/PosterSkeleton.tsx';
import { CastConfirmDrawer } from './CastConfirmDrawer.tsx';
import { SearchBar } from './SearchBar.tsx';
import {
  useAllItems,
  useCast,
  useChildren,
  useEverything,
  useGlobalSearch,
  usePlaybackState,
  usePlayers,
  useSectionItems,
  useSections,
  useServers,
} from '../../api/queries.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';
import type { MediaItemDto } from '../../api/types.ts';

/** Sentinel ids for the aggregate views. */
const ALL_SERVERS = '__all__';
const ALL_SECTIONS = '__all__';

interface Frame {
  ratingKey: string;
  title: string;
  serverId: string;
}

interface BrowseScreenProps {
  onCasted: () => void;
}

export function BrowseScreen({ onCasted }: BrowseScreenProps) {
  const { data: servers } = useServers();
  const { activeServerId, setActiveServer, activeClientId, setNowPlaying } = usePlayerStore();
  const { data: players } = usePlayers();
  // Default view: everything from every server.
  const serverId = activeServerId ?? ALL_SERVERS;
  const isAllServers = serverId === ALL_SERVERS;

  const { data: sections } = useSections(isAllServers ? undefined : serverId);
  const [sectionKey, setSectionKey] = useState<string>();
  const [stack, setStack] = useState<Frame[]>([]);
  const [query, setQuery] = useState('');
  const [pendingCast, setPendingCast] = useState<MediaItemDto>();

  const activeSection = sectionKey ?? ALL_SECTIONS;
  useEffect(() => setStack([]), [activeSection, serverId]);

  const top = stack[stack.length - 1];
  const browsingAll = !top && isAllServers;
  const browsingServerAll = !top && !isAllServers && activeSection === ALL_SECTIONS;

  const everythingQuery = useEverything(browsingAll && !query);
  const sectionQuery = useSectionItems(
    !top && !isAllServers && activeSection !== ALL_SECTIONS ? serverId : undefined,
    activeSection !== ALL_SECTIONS ? activeSection : undefined,
  );
  const serverAllQuery = useAllItems(
    isAllServers ? undefined : serverId,
    browsingServerAll && !query,
  );
  const childrenQuery = useChildren(top?.serverId, top?.ratingKey);
  const searchQuery = useGlobalSearch(query);
  const { data: playbackState } = usePlaybackState(activeClientId);

  const cast = useCast(activeClientId);
  const activePlayerName = players?.find((p) => p.clientId === activeClientId)?.name;

  const list = query
    ? searchQuery
    : top
      ? childrenQuery
      : browsingAll
        ? everythingQuery
        : browsingServerAll
          ? serverAllQuery
          : sectionQuery;

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
          onCasted();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Cast failed'),
      },
    );
  };

  const open = (item: MediaItemDto) => {
    if (item.browsable) {
      setStack((prev) => [
        ...prev,
        { ratingKey: item.ratingKey, title: item.title, serverId: item.serverId },
      ]);
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
    () => [
      { id: ALL_SERVERS, label: 'All' },
      ...(servers ?? []).map((s) => ({ id: s.id, label: s.name })),
    ],
    [servers],
  );
  const sectionChips = useMemo(
    () => [
      { id: ALL_SECTIONS, label: 'All' },
      ...(sections ?? []).map((s) => ({ id: s.key, label: s.title })),
    ],
    [sections],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
      <SearchBar value={query} onChange={setQuery} />

      {!query && (
        <ChipRow
          chips={serverChips}
          activeId={serverId}
          onSelect={(id) => {
            setActiveServer(id);
            setSectionKey(undefined);
          }}
        />
      )}

      {!query && !top && !isAllServers && (
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
        <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {query ? 'No results' : 'Nothing here'}
        </p>
      ) : (
        <VirtualPosterGrid items={list.data} onOpen={open} />
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
