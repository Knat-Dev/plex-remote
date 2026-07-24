import type { MediaItem } from '../../../domain/entities/MediaItem.js';
import type { Player } from '../../../domain/entities/Player.js';
import type { Server } from '../../../domain/entities/Server.js';

/**
 * Domain -> transport mapping. The web never talks to Plex directly, so image
 * paths are rewritten to our authenticated proxy and tokens never cross here.
 */
export function playerDto(p: Player) {
  return {
    clientId: p.clientId,
    name: p.name,
    product: p.product,
    platform: p.platform,
    capabilities: p.capabilities,
    canPlay: p.capabilities.includes('playback'),
    canNavigate: p.capabilities.includes('navigation'),
  };
}

export function serverDto(s: Server) {
  return { id: s.id, name: s.name };
}

export function mediaItemDto(serverId: string, item: MediaItem) {
  return {
    // Origin server travels with the item so cross-server aggregations
    // ("All", global search) can cast to the right backend.
    serverId,
    ratingKey: item.ratingKey,
    title: item.title,
    type: item.type,
    year: item.year ?? null,
    subtitle: subtitleOf(item),
    // Show a container's own poster for its On-Deck episode; the show name
    // heads the card, the episode label is the subtitle.
    showTitle: item.grandparentTitle ?? null,
    browsable: item.browsable,
    durationMs: item.durationMs ?? null,
    thumbUrl: imageUrl(serverId, item.showThumb ?? item.thumb),
    artUrl: imageUrl(serverId, item.art),
    // Watch state, Plex semantics: viewCount>0 ⇒ watched leaf; containers are
    // watched when every leaf is; viewOffset ⇒ resumable position.
    progressMs: item.viewOffsetMs ?? null,
    watched: isWatched(item),
    unwatchedCount: unwatchedCount(item),
  };
}

function isWatched(item: MediaItem): boolean {
  if (item.leafCount !== undefined) {
    return item.leafCount > 0 && (item.viewedLeafCount ?? 0) >= item.leafCount;
  }
  return (item.viewCount ?? 0) > 0;
}

function unwatchedCount(item: MediaItem): number | null {
  if (item.leafCount === undefined) return null;
  const remaining = item.leafCount - (item.viewedLeafCount ?? 0);
  return remaining > 0 ? remaining : null;
}

function subtitleOf(item: MediaItem): string | null {
  if (item.type === 'episode') {
    const s = item.seasonIndex !== undefined ? `S${item.seasonIndex}` : '';
    const e = item.index !== undefined ? `E${item.index}` : '';
    return [s, e].filter(Boolean).join(' · ') || item.parentTitle || null;
  }
  return item.parentTitle ?? null;
}

function imageUrl(serverId: string, path: string | undefined): string | null {
  if (!path) return null;
  return `/api/image?serverId=${encodeURIComponent(serverId)}&path=${encodeURIComponent(path)}`;
}
