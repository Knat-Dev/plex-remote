import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { api } from './client.ts';
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
  return useQuery({ queryKey: KEYS.players, queryFn: () => api.get<PlayerDto[]>('/players') });
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
  return useQuery({
    queryKey: KEYS.state(clientId ?? ''),
    queryFn: () => api.get<PlaybackStateDto>(`/players/${clientId}/state`),
    enabled: Boolean(clientId),
    // Keep polling when the window is unfocused: the remote often runs
    // side-by-side with other apps and must stay truthful.
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });
}

export function useCast(clientId: string | undefined) {
  return useMutation({
    mutationFn: (vars: { serverId: string; ratingKey: string; mediaType: string }) =>
      api.post(`/players/${clientId}/cast`, vars),
  });
}

export function usePlayerCommands(clientId: string | undefined) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEYS.state(clientId ?? '') });
  return {
    playback: useMutation({
      mutationFn: (command: PlaybackCommandDto) =>
        api.post(`/players/${clientId}/playback`, { command }),
      onSuccess: invalidate,
    }),
    navigate: useMutation({
      mutationFn: (action: NavigationActionDto) =>
        api.post(`/players/${clientId}/navigate`, { action }),
    }),
    seek: useMutation({
      mutationFn: (offsetMs: number) => api.post(`/players/${clientId}/seek`, { offsetMs }),
      onSuccess: invalidate,
    }),
    volume: useMutation({
      mutationFn: (level: number) => api.post(`/players/${clientId}/volume`, { level }),
    }),
  };
}
