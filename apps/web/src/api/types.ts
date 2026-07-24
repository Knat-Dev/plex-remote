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
  browsable: boolean;
  durationMs: number | null;
  thumbUrl: string | null;
  artUrl: string | null;
}

export type MediaTypeDto =
  | 'movie' | 'show' | 'season' | 'episode'
  | 'artist' | 'album' | 'track' | 'collection';

export interface PlaybackStateDto {
  status: 'playing' | 'paused' | 'buffering' | 'stopped';
  ratingKey?: string;
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
