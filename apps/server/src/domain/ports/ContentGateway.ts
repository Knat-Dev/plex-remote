import type { Server } from '../entities/Server.js';
import type { LibrarySection, MediaItem } from '../entities/MediaItem.js';

/**
 * Read-side access to Plex content: servers, libraries, items, search.
 * Implemented by infrastructure; consumed by use cases.
 */
export interface ContentGateway {
  listServers(): Promise<Server[]>;
  listSections(serverId: string): Promise<LibrarySection[]>;
  listSectionItems(serverId: string, sectionKey: string): Promise<MediaItem[]>;
  /** Every item across all of the server's library sections. */
  listAllItems(serverId: string): Promise<MediaItem[]>;
  listChildren(serverId: string, ratingKey: string): Promise<MediaItem[]>;
  /** Metadata for a single item, or undefined when it no longer exists. */
  getItem(serverId: string, ratingKey: string): Promise<MediaItem | undefined>;
  /** Mark watched (removes from Continue Watching) or unwatched. */
  setWatched(serverId: string, ratingKey: string, watched: boolean): Promise<void>;
  search(serverId: string, query: string): Promise<MediaItem[]>;
  /** "Continue Watching" — in-progress items and next-up episodes. */
  listOnDeck(serverId: string): Promise<MediaItem[]>;
  /** Raw image bytes for a thumb/art path, token applied server-side. */
  fetchImage(serverId: string, path: string): Promise<ImagePayload>;
}

export interface ImagePayload {
  readonly body: ReadableStream<Uint8Array> | Buffer;
  readonly contentType: string;
}
