/** Transport types mirroring the server's DTOs (the app's view of the domain). */

export interface PlayerDto {
  clientId: string;
  name: string;
  product: string;
  platform: string;
  capabilities: string[];
  canPlay: boolean;
  canNavigate: boolean;
}

export interface ServerDto {
  id: string;
  name: string;
}

export interface SectionDto {
  key: string;
  title: string;
  type: string;
}

export interface MediaItemDto {
  /** Origin server — aggregated views mix servers, casting must target this. */
  serverId: string;
  ratingKey: string;
  title: string;
  type: MediaTypeDto;
  year: number | null;
  subtitle: string | null;
  /** Parent show title (episodes) — heads a Continue Watching card. */
  showTitle: string | null;
  browsable: boolean;
  durationMs: number | null;
  thumbUrl: string | null;
  artUrl: string | null;
  /** Resume position when partially watched. */
  progressMs: number | null;
  watched: boolean;
  /** Remaining episodes (containers only). */
  unwatchedCount: number | null;
}

export type MediaTypeDto =
  | 'movie' | 'show' | 'season' | 'episode'
  | 'artist' | 'album' | 'track' | 'collection';

export interface PlaybackStateDto {
  status: 'playing' | 'paused' | 'buffering' | 'stopped';
  ratingKey?: string;
  /** Server that owns the playing content (for metadata lookups). */
  contentServerId?: string;
  title?: string;
  timeMs: number;
  durationMs: number;
  volume?: number;
  muted: boolean;
}

export type PlaybackCommandDto =
  | 'play' | 'pause' | 'stop' | 'skipNext' | 'skipPrevious' | 'stepForward' | 'stepBack';

export type NavigationActionDto =
  | 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'select' | 'back' | 'home';
