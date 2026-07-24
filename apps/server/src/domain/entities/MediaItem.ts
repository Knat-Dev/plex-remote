/**
 * A browsable/playable piece of content, normalised across Plex media types.
 */
export type MediaType =
  | 'movie'
  | 'show'
  | 'season'
  | 'episode'
  | 'artist'
  | 'album'
  | 'track'
  | 'collection'
  | 'library';

export interface MediaItem {
  readonly ratingKey: string;
  readonly key: string;
  readonly title: string;
  readonly type: MediaType;
  readonly thumb?: string;
  readonly art?: string;
  readonly year?: number;
  readonly summary?: string;
  readonly durationMs?: number;
  readonly index?: number;
  readonly parentTitle?: string;
  readonly grandparentTitle?: string;
  /** True when this item can be opened to reveal children (show, season, library…). */
  readonly browsable: boolean;
  /** Resume position, when the item is partially watched. */
  readonly viewOffsetMs?: number;
  /** Times fully watched (>0 ⇒ watched, for leaf items). */
  readonly viewCount?: number;
  /** Total / watched leaf episodes (containers: show, season). */
  readonly leafCount?: number;
  readonly viewedLeafCount?: number;
}

export interface LibrarySection {
  readonly key: string;
  readonly title: string;
  readonly type: MediaType;
}
