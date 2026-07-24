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
  listChildren(serverId: string, ratingKey: string): Promise<MediaItem[]>;
  search(serverId: string, query: string): Promise<MediaItem[]>;
  /** Raw image bytes for a thumb/art path, token applied server-side. */
  fetchImage(serverId: string, path: string): Promise<ImagePayload>;
}

export interface ImagePayload {
  readonly body: ReadableStream<Uint8Array> | Buffer;
  readonly contentType: string;
}
