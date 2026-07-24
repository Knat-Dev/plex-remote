import { useEffect, useMemo, useState } from 'react';
import { ChipRow } from '../../components/ChipRow.tsx';
import { PosterGrid } from '../../components/PosterGrid.tsx';
import { PosterSkeleton } from '../../components/PosterSkeleton.tsx';
import { EmptyState } from '../../ui/Spinner.tsx';
import { BackIcon } from '../../ui/icons.tsx';
import { SearchBar } from './SearchBar.tsx';
import {
  useCast,
  useChildren,
  usePlayers,
  useSearch,
  useSectionItems,
  useSections,
  useServers,
} from '../../api/queries.ts';
import { usePlayerStore } from '../../state/usePlayerStore.ts';
import { useToast } from '../../ui/Toast.tsx';
import type { MediaItemDto } from '../../api/types.ts';

interface Frame {
  ratingKey: string;
  title: string;
}

export function BrowseScreen() {
  const notify = useToast();
  const { data: servers } = useServers();
  const { activeServerId, setActiveServer, activeClientId, setNowPlaying } = usePlayerStore();
  const { data: players } = usePlayers();
  const serverId = activeServerId ?? servers?.[0]?.id;

  const { data: sections } = useSections(serverId);
  const [sectionKey, setSectionKey] = useState<string>();
  const [stack, setStack] = useState<Frame[]>([]);
  const [query, setQuery] = useState('');

  const activeSection = sectionKey ?? sections?.[0]?.key;
  useEffect(() => setStack([]), [activeSection, serverId]);

  const top = stack[stack.length - 1];
  const sectionQuery = useSectionItems(serverId, top ? undefined : activeSection);
  const childrenQuery = useChildren(serverId, top?.ratingKey);
  const searchQuery = useSearch(serverId, query);

  const cast = useCast(activeClientId);
  const activePlayerName = players?.find((p) => p.clientId === activeClientId)?.name;

  const list = query ? searchQuery : top ? childrenQuery : sectionQuery;

  const open = (item: MediaItemDto) => {
    if (item.browsable) {
      setStack((prev) => [...prev, { ratingKey: item.ratingKey, title: item.title }]);
      return;
    }
    if (!serverId) return;
    if (!activeClientId) {
      notify('Pick a player first', 'error');
      return;
    }
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
          notify(`Casting “${item.title}” to ${activePlayerName ?? 'player'}`);
        },
        onError: (e) => notify(e instanceof Error ? e.message : 'Cast failed', 'error'),
      },
    );
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
        <button
          onClick={() => setStack((prev) => prev.slice(0, -1))}
          className="flex items-center gap-1 self-start rounded-full bg-[var(--color-surface-2)] py-1.5 pl-2 pr-3 text-sm ring-1 ring-[var(--color-border)]"
        >
          <BackIcon width={18} height={18} />
          {top.title}
        </button>
      )}

      {list.isLoading ? (
        <PosterSkeleton />
      ) : !list.data || list.data.length === 0 ? (
        <EmptyState message={query ? 'No results' : 'Nothing here'} />
      ) : (
        <PosterGrid items={list.data} onOpen={open} />
      )}
    </div>
  );
}
