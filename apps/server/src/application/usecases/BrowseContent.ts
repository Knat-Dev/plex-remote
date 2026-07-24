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

  allItems(serverId: string): Promise<MediaItem[]> {
    return this.content.listAllItems(serverId);
  }

  /** Everything across every server; each entry keeps its origin serverId. */
  async allItemsEverywhere(): Promise<Array<{ serverId: string; item: MediaItem }>> {
    return this.#fanOut((serverId) => this.content.listAllItems(serverId));
  }

  /** Search all servers at once. */
  async searchEverywhere(query: string): Promise<Array<{ serverId: string; item: MediaItem }>> {
    return this.#fanOut((serverId) => this.content.search(serverId, query.trim()));
  }

  /** "Continue Watching" across every server. */
  async onDeckEverywhere(): Promise<Array<{ serverId: string; item: MediaItem }>> {
    return this.#fanOut((serverId) => this.content.listOnDeck(serverId));
  }

  async #fanOut(
    fetch: (serverId: string) => Promise<MediaItem[]>,
  ): Promise<Array<{ serverId: string; item: MediaItem }>> {
    const servers = await this.content.listServers();
    const results = await Promise.allSettled(
      servers.map(async (server) => ({
        serverId: server.id,
        items: await fetch(server.id),
      })),
    );
    // One unreachable server must not blank the aggregate view.
    return results.flatMap((result) =>
      result.status === 'fulfilled'
        ? result.value.items.map((item) => ({ serverId: result.value.serverId, item }))
        : [],
    );
  }

  children(serverId: string, ratingKey: string): Promise<MediaItem[]> {
    return this.content.listChildren(serverId, ratingKey);
  }

  item(serverId: string, ratingKey: string): Promise<MediaItem | undefined> {
    return this.content.getItem(serverId, ratingKey);
  }

  setWatched(serverId: string, ratingKey: string, watched: boolean): Promise<void> {
    return this.content.setWatched(serverId, ratingKey, watched);
  }

  search(serverId: string, query: string): Promise<MediaItem[]> {
    return this.content.search(serverId, query.trim());
  }

  image(serverId: string, path: string): Promise<ImagePayload> {
    return this.content.fetchImage(serverId, path);
  }
}
