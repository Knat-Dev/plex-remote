import type { FastifyInstance } from 'fastify';
import type { Container } from '../../../container.js';
import { mediaItemDto, serverDto } from '../mappers/dto.js';
import { imageQuerySchema, searchQuerySchema } from '../schemas.js';

type ServerParams = { serverId: string };

export function registerLibraryRoutes(app: FastifyInstance, c: Container): void {
  app.get('/api/servers', async () => {
    return (await c.browseContent.servers()).map(serverDto);
  });

  app.get<{ Params: ServerParams }>('/api/servers/:serverId/sections', async (req) => {
    return c.browseContent.sections(req.params.serverId);
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
