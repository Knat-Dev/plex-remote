import type { FastifyInstance } from 'fastify';
import type { Container } from '../../../container.js';
import { NotFoundError } from '../../../shared/errors.js';
import { mediaItemDto, serverDto } from '../mappers/dto.js';
import { imageQuerySchema, searchQuerySchema } from '../schemas.js';

type ServerParams = { serverId: string };

export function registerLibraryRoutes(app: FastifyInstance, c: Container): void {
  app.get('/api/servers', async () => {
    return (await c.browseContent.servers()).map(serverDto);
  });

  app.get('/api/items', async () => {
    const entries = await c.browseContent.allItemsEverywhere();
    return entries.map(({ serverId, item }) => mediaItemDto(serverId, item));
  });

  app.get('/api/search', async (req) => {
    const { q } = searchQuerySchema.parse(req.query);
    const entries = await c.browseContent.searchEverywhere(q);
    return entries.map(({ serverId, item }) => mediaItemDto(serverId, item));
  });

  app.post<{ Params: ServerParams & { ratingKey: string }; Body: { watched?: boolean } }>(
    '/api/servers/:serverId/items/:ratingKey/watched',
    async (req) => {
      const watched = req.body?.watched !== false;
      await c.browseContent.setWatched(req.params.serverId, req.params.ratingKey, watched);
      return { ok: true };
    },
  );

  app.get('/api/ondeck', async () => {
    const entries = await c.browseContent.onDeckEverywhere();
    return entries.map(({ serverId, item }) => mediaItemDto(serverId, item));
  });

  app.get<{ Params: ServerParams }>('/api/servers/:serverId/sections', async (req) => {
    return c.browseContent.sections(req.params.serverId);
  });

  app.get<{ Params: ServerParams }>('/api/servers/:serverId/items', async (req) => {
    const items = await c.browseContent.allItems(req.params.serverId);
    return items.map((item) => mediaItemDto(req.params.serverId, item));
  });

  app.get<{ Params: ServerParams & { sectionKey: string } }>(
    '/api/servers/:serverId/sections/:sectionKey/items',
    async (req) => {
      const items = await c.browseContent.sectionItems(
        req.params.serverId,
        req.params.sectionKey,
      );
      return items.map((item) => mediaItemDto(req.params.serverId, item));
    },
  );

  app.get<{ Params: ServerParams & { ratingKey: string } }>(
    '/api/servers/:serverId/items/:ratingKey',
    async (req) => {
      const item = await c.browseContent.item(req.params.serverId, req.params.ratingKey);
      if (!item) throw new NotFoundError(`Item ${req.params.ratingKey}`);
      return mediaItemDto(req.params.serverId, item);
    },
  );

  app.get<{ Params: ServerParams & { ratingKey: string } }>(
    '/api/servers/:serverId/items/:ratingKey/children',
    async (req) => {
      const items = await c.browseContent.children(req.params.serverId, req.params.ratingKey);
      return items.map((item) => mediaItemDto(req.params.serverId, item));
    },
  );

  app.get<{ Params: ServerParams }>('/api/servers/:serverId/search', async (req) => {
    const { q } = searchQuerySchema.parse(req.query);
    const items = await c.browseContent.search(req.params.serverId, q);
    return items.map((item) => mediaItemDto(req.params.serverId, item));
  });

  app.get('/api/image', async (req, reply) => {
    const { serverId, path } = imageQuerySchema.parse(req.query);
    const image = await c.browseContent.image(serverId, path);
    return reply
      .header('content-type', image.contentType)
      .header('cache-control', 'public, max-age=86400')
      .send(image.body);
  });
}
