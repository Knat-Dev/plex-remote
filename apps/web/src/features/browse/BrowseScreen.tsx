import { useMemo } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VirtualPosterGrid } from '../../components/VirtualPosterGrid.tsx';
import { PosterSkeleton } from '../../components/PosterSkeleton.tsx';
import { SearchBar } from './SearchBar.tsx';
import { useCastFlow } from './useCastFlow.tsx';
import {
  useAllItems,
  useEverything,
  useGlobalSearch,
  useOnDeck,
  useSectionItems,
  useSections,
  useServers,
} from '../../api/queries.ts';
import { ALL } from '../../lib/sentinels.ts';

const routeApi = getRouteApi('/');

/** Continue Watching — the default landing library, filterable by server. */
const ONDECK = 'ondeck';

/** Cross-server "library" filters: sections differ per server, types don't. */
const TYPE_FILTERS = [
  { id: 'movies', label: 'Movies', types: ['movie'] },
  { id: 'shows', label: 'Shows', types: ['show', 'season', 'episode'] },
  { id: 'music', label: 'Music', types: ['artist', 'album', 'track'] },
] as const;

export function BrowseScreen() {
  // Default landing is Continue Watching, so opening the app lands you where
  // you stopped. server=All by default.
  const { server = ALL, lib = ONDECK, q = '' } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { open, drawer } = useCastFlow();

  const isAllServers = server === ALL;
  const { data: servers } = useServers();
  const sectionsQuery = useSections(isAllServers ? undefined : server);

  // Exactly one browse mode is active (search wins).
  const onDeck = !q && lib === ONDECK;
  const typeFilter = !q && isAllServers && isTypeFilter(lib);
  const everything = !q && isAllServers && lib === ALL;
  const serverAll = !q && !isAllServers && lib === ALL;
  const section = !q && !isAllServers && lib !== ALL && lib !== ONDECK;

  const onDeckQuery = useOnDeck();
  const everythingQuery = useEverything(everything || typeFilter);
  const serverAllQuery = useAllItems(isAllServers ? undefined : server, serverAll);
  const sectionQuery = useSectionItems(section ? server : undefined, section ? lib : undefined);
  const searchQuery = useGlobalSearch(q);

  const list = q
    ? searchQuery
    : onDeck
      ? onDeckQuery
      : section
        ? sectionQuery
        : serverAll
          ? serverAllQuery
          : everythingQuery; // everything OR type filter (same dataset)

  // Client-side narrowing on the shared datasets: On Deck by server, type
  // filters by media type (section names differ per server, media types don't).
  const visibleItems = useMemo(() => {
    let items = list.data ?? [];
    if (onDeck && !isAllServers) items = items.filter((i) => i.serverId === server);
    if (typeFilter) {
      const allowed = TYPE_FILTERS.find((f) => f.id === lib)?.types;
      if (allowed) items = items.filter((i) => (allowed as readonly string[]).includes(i.type));
    }
    return items;
  }, [list.data, onDeck, typeFilter, isAllServers, server, lib]);

  // Filter changes replace history (no back-spam).
  const setSearch = (patch: Partial<{ server: string; lib: string; q: string }>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const libraryOptions = isAllServers
    ? [{ id: ALL, label: 'All libraries' }, ...TYPE_FILTERS.map((f) => ({ id: f.id, label: f.label }))]
    : [
        { id: ALL, label: 'All libraries' },
        ...(sectionsQuery.data ?? []).map((s) => ({ id: s.key, label: s.title })),
      ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
      <SearchBar value={q} onChange={(value) => setSearch({ q: value })} />

      {!q && (
        <div className="grid grid-cols-2 gap-2">
          <Select value={server} onValueChange={(value) => setSearch({ server: value, lib })}>
            <SelectTrigger className="w-full rounded-xl bg-secondary">
              <SelectValue placeholder="Server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All servers</SelectItem>
              {(servers ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={lib} onValueChange={(value) => setSearch({ lib: value })}>
            <SelectTrigger className="w-full rounded-xl bg-secondary">
              <SelectValue placeholder="Library" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ONDECK}>Continue Watching</SelectItem>
              <SelectSeparator />
              {libraryOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {list.isLoading ? (
        <PosterSkeleton />
      ) : list.isError || sectionsQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">Couldn’t reach the server.</p>
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              void list.refetch();
              void sectionsQuery.refetch();
            }}
          >
            <RotateCw className="size-4" /> Retry
          </Button>
        </div>
      ) : visibleItems.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {q
            ? 'No results'
            : onDeck
              ? 'Nothing in progress. Pick a library to start something.'
              : 'Nothing here'}
        </p>
      ) : (
        <VirtualPosterGrid items={visibleItems} onOpen={open} />
      )}

      {drawer}
    </div>
  );
}

function isTypeFilter(lib: string): boolean {
  return TYPE_FILTERS.some((f) => f.id === lib);
}
