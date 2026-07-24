import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { api } from './client.ts';
import { pollHold, predictPlayback, predictSeek, predictVolume } from './optimistic.ts';
import type {
  MediaItemDto,
  NavigationActionDto,
  PlaybackCommandDto,
  PlaybackStateDto,
  PlayerDto,
  SectionDto,
  ServerDto,
} from './types.ts';

const KEYS = {
  players: ['players'] as const,
  servers: ['servers'] as const,
  sections: (s: string) => ['sections', s] as const,
  items: (s: string, k: string) => ['items', s, k] as const,
  children: (s: string, k: string) => ['children', s, k] as const,
  search: (s: string, q: string) => ['search', s, q] as const,
  state: (c: string) => ['state', c] as const,
};

export function usePlayers(): UseQueryResult<PlayerDto[]> {
  // Kept fresh by the realtime socket (useRealtime pushes into this cache key);
  // the initial fetch just primes it. No client polling.
  return useQuery({
    queryKey: KEYS.players,
    queryFn: () => api.get<PlayerDto[]>('/players'),
    staleTime: Infinity,
  });
}

export function useServers(): UseQueryResult<ServerDto[]> {
  return useQuery({ queryKey: KEYS.servers, queryFn: () => api.get<ServerDto[]>('/servers') });
}

export function useSections(serverId: string | undefined) {
  return useQuery({
    queryKey: KEYS.sections(serverId ?? ''),
    queryFn: () => api.get<SectionDto[]>(`/servers/${serverId}/sections`),
    enabled: Boolean(serverId),
  });
}

export function useSectionItems(serverId: string | undefined, sectionKey: string | undefined) {
  return useQuery({
    queryKey: KEYS.items(serverId ?? '', sectionKey ?? ''),
    queryFn: () =>
      api.get<MediaItemDto[]>(`/servers/${serverId}/sections/${sectionKey}/items`),
    enabled: Boolean(serverId && sectionKey),
  });
}

export function useAllItems(serverId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['all-items', serverId ?? ''],
    queryFn: () => api.get<MediaItemDto[]>(`/servers/${serverId}/items`),
    enabled: Boolean(serverId) && enabled,
  });
}

/** Everything from every server, mixed. */
export function useEverything(enabled: boolean) {
  return useQuery({
    queryKey: ['everything'],
    queryFn: () => api.get<MediaItemDto[]>('/items'),
    enabled,
  });
}

/** Continue Watching across every server. Kept fresh by the realtime socket
 *  invalidation when playback stops, plus a light refetch on focus. */
export function useOnDeck() {
  return useQuery({
    queryKey: ['ondeck'],
    queryFn: () => api.get<MediaItemDto[]>('/ondeck'),
  });
}

/** Search across every server at once. */
export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: () => api.get<MediaItemDto[]>(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length > 1,
  });
}

export function useChildren(serverId: string | undefined, ratingKey: string | undefined) {
  return useQuery({
    queryKey: KEYS.children(serverId ?? '', ratingKey ?? ''),
    queryFn: () => api.get<MediaItemDto[]>(`/servers/${serverId}/items/${ratingKey}/children`),
    enabled: Boolean(serverId && ratingKey),
  });
}

export function useSearch(serverId: string | undefined, query: string) {
  return useQuery({
    queryKey: KEYS.search(serverId ?? '', query),
    queryFn: () =>
      api.get<MediaItemDto[]>(`/servers/${serverId}/search?q=${encodeURIComponent(query)}`),
    enabled: Boolean(serverId && query.trim().length > 1),
  });
}

export function usePlaybackState(clientId: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: KEYS.state(clientId ?? ''),
    queryFn: async () => {
      // During the optimistic hold, serve the predicted state instead of
      // hitting the network — a timer scheduled before the command fired
      // could otherwise fetch and reinstate stale state mid-transition.
      if (pollHold.remainingMs() > 0) {
        const cached = qc.getQueryData<PlaybackStateDto>(KEYS.state(clientId ?? ''));
        if (cached) return cached;
      }
      return api.get<PlaybackStateDto>(`/players/${clientId}/state`);
    },
    enabled: Boolean(clientId),
    // Kept fresh by the realtime socket; the initial fetch primes the cache
    // before the first pushed frame arrives. No client polling.
    staleTime: Infinity,
  });
}

export function useCast(clientId: string | undefined) {
  return useMutation({
    mutationFn: (vars: {
      serverId: string;
      ratingKey: string;
      mediaType: string;
      offsetMs: number;
    }) => api.post(`/players/${clientId}/cast`, vars),
  });
}

export function usePlayerCommands(clientId: string | undefined) {
  const qc = useQueryClient();
  const stateKey = KEYS.state(clientId ?? '');

  /**
   * Optimistic mutation scaffold: cancel in-flight polls, apply the predicted
   * state immediately, hold polling while the player reacts, roll back on
   * error. The regular poll reconciles with reality once the hold expires.
   */
  const optimistic = <TVars>(
    mutationFn: (vars: TVars) => Promise<unknown>,
    predict: (state: PlaybackStateDto, vars: TVars) => PlaybackStateDto,
  ) =>
    useMutation({
      mutationFn,
      onMutate: async (vars: TVars) => {
        await qc.cancelQueries({ queryKey: stateKey });
        const previous = qc.getQueryData<PlaybackStateDto>(stateKey);
        if (previous) qc.setQueryData(stateKey, predict(previous, vars));
        pollHold.start();
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) qc.setQueryData(stateKey, context.previous);
      },
    });

  return {
    playback: optimistic(
      (command: PlaybackCommandDto) => api.post(`/players/${clientId}/playback`, { command }),
      predictPlayback,
    ),
    seek: optimistic(
      (offsetMs: number) => api.post(`/players/${clientId}/seek`, { offsetMs }),
      predictSeek,
    ),
    volume: optimistic(
      (level: number) => api.post(`/players/${clientId}/volume`, { level }),
      predictVolume,
    ),
    navigate: useMutation({
      mutationFn: (action: NavigationActionDto) =>
        api.post(`/players/${clientId}/navigate`, { action }),
    }),
  };
}
