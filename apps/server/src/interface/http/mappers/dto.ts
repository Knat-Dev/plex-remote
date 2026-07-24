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
    ratingKey: item.ratingKey,
    title: item.title,
    type: item.type,
    year: item.year ?? null,
    subtitle: subtitleOf(item),
    browsable: item.browsable,
    durationMs: item.durationMs ?? null,
    thumbUrl: imageUrl(serverId, item.thumb),
    artUrl: imageUrl(serverId, item.art),
  };
}

function subtitleOf(item: MediaItem): string | null {
  if (item.type === 'episode') {
    const code = item.index !== undefined ? `E${item.index}` : '';
    return [item.grandparentTitle, code].filter(Boolean).join(' · ') || null;
  }
  return item.parentTitle ?? null;
}

function imageUrl(serverId: string, path: string | undefined): string | null {
  if (!path) return null;
  return `/api/image?serverId=${encodeURIComponent(serverId)}&path=${encodeURIComponent(path)}`;
}
