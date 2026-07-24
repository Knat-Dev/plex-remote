import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.ts';
import type { MediaItemDto, PlaybackStateDto } from '../api/types.ts';
import { usePlayerStore, type NowPlayingMeta } from '../state/usePlayerStore.ts';

/**
 * Metadata (title/artwork) for whatever the player is currently playing.
 * Fast path: the locally-stored meta from a cast this device initiated.
 * Fallback: resolve the timeline's ratingKey against its content server — so
 * the app shows the right title even when playback was started elsewhere or
 * before the app was opened.
 */
export function useNowPlayingMeta(
  state: PlaybackStateDto | undefined,
): NowPlayingMeta | undefined {
  const { nowPlaying } = usePlayerStore();
  const local = nowPlaying?.ratingKey === state?.ratingKey ? nowPlaying : undefined;

  const serverId = state?.contentServerId;
  const ratingKey = state?.ratingKey;
  const { data: fetched } = useQuery({
    queryKey: ['item-meta', serverId ?? '', ratingKey ?? ''],
    queryFn: () => api.get<MediaItemDto>(`/servers/${serverId}/items/${ratingKey}`),
    enabled: Boolean(serverId && ratingKey && !local),
    staleTime: 5 * 60_000,
  });

  if (local) return local;
  if (fetched && fetched.ratingKey === ratingKey) {
    return {
      ratingKey: fetched.ratingKey,
      title: fetched.title,
      thumbUrl: fetched.thumbUrl,
      artUrl: fetched.artUrl,
    };
  }
  return undefined;
}
