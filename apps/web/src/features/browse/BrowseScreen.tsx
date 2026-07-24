import { useMemo } from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
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
  useSectionItems,
  useSections,
  useServers,
} from '../../api/queries.ts';
import { getRouteApi } from '@tanstack/react-router';
import { ALL } from '../../lib/sentinels.ts';

const routeApi = getRouteApi('/');

/** Cross-server "library" filters: sections differ per server, types don't. */
const TYPE_FILTERS = [
  { id: ALL, label: 'All libraries', types: undefined },
  { id: 'movies', label: 'Movies', types: ['movie'] },
  { id: 'shows', label: 'Shows', types: ['show', 'season', 'episode'] },
  { id: 'music', label: 'Music', types: ['artist', 'album', 'track'] },
] as const;

export function BrowseScreen() {
  const { server = ALL, lib = ALL, q = '' } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const { open, drawer } = useCastFlow();

  const isAllServers = server === ALL;
  const { data: servers } = useServers();
  const sectionsQuery = useSections(isAllServers ? undefined : server);

  const browsingAll = isAllServers && !q;
  const browsingServerAll = !isAllServers && lib === ALL && !q;
  const browsingSection = !isAllServers && lib !== ALL && !q;

  const everythingQuery = useEverything(browsingAll);
  const serverAllQuery = useAllItems(isAllServers ? undefined : server, browsingServerAll);
  const sectionQuery = useSectionItems(
    browsingSection ? server : undefined,
    browsingSection ? lib : undefined,
  );
  const searchQuery = useGlobalSearch(q);

  const list = q
    ? searchQuery
    : browsingAll
      ? everythingQuery
      : browsingServerAll
        ? serverAllQuery
        : sectionQuery;

  // In All-servers mode the library select applies a client-side type filter —
  // section names differ per server, media types don't.
  const visibleItems = useMemo(() => {
    const items = list.data ?? [];
    if (!browsingAll || lib === ALL) return items;
    const allowed = TYPE_FILTERS.find((f) => f.id === lib)?.types;
    return allowed ? items.filter((i) => (allowed as readonly string[]).includes(i.type)) : items;
  }, [list.data, browsingAll, lib]);

  // Filter changes replace history (no back-spam); a new server resets the lib.
  const setSearch = (patch: Partial<{ server: string; lib: string; q: string }>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const libraryOptions = isAllServers
    ? TYPE_FILTERS.map((f) => ({ id: f.id, label: f.label }))
    : [
        { id: ALL, label: 'All libraries' },
        ...(sectionsQuery.data ?? []).map((s) => ({ id: s.key, label: s.title })),
      ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
      <SearchBar value={q} onChange={(value) => setSearch({ q: value })} />

      {!q && (
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={server}
            onValueChange={(value) => setSearch({ server: value, lib: ALL })}
          >
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
        <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {q ? 'No results' : 'Nothing here'}
        </p>
      ) : (
        <VirtualPosterGrid items={visibleItems} onOpen={open} />
      )}

      {drawer}
    </div>
  );
}
