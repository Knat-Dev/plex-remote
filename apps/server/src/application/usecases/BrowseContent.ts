import type { ContentGateway, ImagePayload } from '../../domain/ports/ContentGateway.js';
import type { LibrarySection, MediaItem } from '../../domain/entities/MediaItem.js';
import type { Server } from '../../domain/entities/Server.js';

/** Read-only navigation of servers, libraries, items and search. */
export class BrowseContent {
  constructor(private readonly content: ContentGateway) {}

  servers(): Promise<Server[]> {
    return this.content.listServers();
  }

  sections(serverId: string): Promise<LibrarySection[]> {
    return this.content.listSections(serverId);
  }

  sectionItems(serverId: string, sectionKey: string): Promise<MediaItem[]> {
    return this.content.listSectionItems(serverId, sectionKey);
  }

  children(serverId: string, ratingKey: string): Promise<MediaItem[]> {
    return this.content.listChildren(serverId, ratingKey);
  }

  search(serverId: string, query: string): Promise<MediaItem[]> {
    return this.content.search(serverId, query.trim());
  }

  image(serverId: string, path: string): Promise<ImagePayload> {
    return this.content.fetchImage(serverId, path);
  }
}
