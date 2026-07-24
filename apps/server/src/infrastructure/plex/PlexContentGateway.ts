import type { Environment } from '../../config/environment.js';
import type { TokenProvider } from '../../config/TokenProvider.js';
import type { ContentGateway, ImagePayload } from '../../domain/ports/ContentGateway.js';
import type { LibrarySection, MediaItem } from '../../domain/entities/MediaItem.js';
import type { Server } from '../../domain/entities/Server.js';
import { PlexHttpClient } from './PlexHttpClient.js';
import { ServerRegistry } from './ServerRegistry.js';
import { plexHeaders } from './plexHeaders.js';
import {
  toMediaItem,
  toSection,
  type DirectoryDto,
  type MetadataDto,
} from './plexMappers.js';

interface Container<T> {
  MediaContainer?: { Directory?: T[]; Metadata?: T[]; Hub?: Array<{ Metadata?: T[] }> };
}

/** Reads content from Plex servers, normalising XML/JSON quirks into domain types. */
export class PlexContentGateway implements ContentGateway {
  constructor(
    private readonly env: Environment,
    private readonly tokens: TokenProvider,
    private readonly http: PlexHttpClient,
    private readonly registry: ServerRegistry,
  ) {}

  listServers(): Promise<Server[]> {
    return this.registry.servers();
  }

  async listSections(serverId: string): Promise<LibrarySection[]> {
    const data = await this.#get<Container<DirectoryDto>>(serverId, '/library/sections');
    return (data.MediaContainer?.Directory ?? []).map(toSection);
  }

  async listSectionItems(serverId: string, sectionKey: string): Promise<MediaItem[]> {
    const data = await this.#get<Container<MetadataDto>>(
      serverId,
      `/library/sections/${encodeURIComponent(sectionKey)}/all`,
    );
    return (data.MediaContainer?.Metadata ?? []).map(toMediaItem);
  }

  async listAllItems(serverId: string): Promise<MediaItem[]> {
    const sections = await this.listSections(serverId);
    const perSection = await Promise.allSettled(
      sections.map((section) => this.listSectionItems(serverId, section.key)),
    );
    // A single unreachable section must not blank the whole view.
    return perSection.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : [],
    );
  }

  async listChildren(serverId: string, ratingKey: string): Promise<MediaItem[]> {
    const data = await this.#get<Container<MetadataDto>>(
      serverId,
      `/library/metadata/${encodeURIComponent(ratingKey)}/children`,
    );
    return (data.MediaContainer?.Metadata ?? []).map(toMediaItem);
  }

  async getItem(serverId: string, ratingKey: string): Promise<MediaItem | undefined> {
    const data = await this.#get<Container<MetadataDto>>(
      serverId,
      `/library/metadata/${encodeURIComponent(ratingKey)}`,
    );
    const dto = data.MediaContainer?.Metadata?.[0];
    return dto ? toMediaItem(dto) : undefined;
  }

  async search(serverId: string, query: string): Promise<MediaItem[]> {
    const data = await this.#get<Container<MetadataDto>>(serverId, '/hubs/search', {
      query,
      limit: 30,
    });
    const hubs = data.MediaContainer?.Hub ?? [];
    return hubs.flatMap((hub) => (hub.Metadata ?? []).map(toMediaItem));
  }

  async fetchImage(serverId: string, path: string): Promise<ImagePayload> {
    const base = await this.registry.baseUrl(serverId);
    const token = await this.tokens.get();
    const res = await this.http.raw(`${base}${path}`, {
      query: { 'X-Plex-Token': token },
      timeoutMs: this.env.requestTimeoutMs,
      retries: 1,
    });
    const buffer = Buffer.from(await res.arrayBuffer());
    return { body: buffer, contentType: res.headers.get('content-type') ?? 'image/jpeg' };
  }

  async #get<T>(
    serverId: string,
    path: string,
    query?: Record<string, string | number>,
  ): Promise<T> {
    const base = await this.registry.baseUrl(serverId);
    const token = await this.tokens.get();
    return this.http.json<T>(`${base}${path}`, {
      headers: plexHeaders(this.env, token),
      timeoutMs: this.env.requestTimeoutMs,
      ...(query ? { query } : {}),
    });
  }
}
