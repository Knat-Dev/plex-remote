import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Container } from '../../../container.js';

const activeBodySchema = z.object({ uuid: z.string().min(1) });

/**
 * Plex Home user selection. Content is read as the active user so Continue
 * Watching / progress reflect that person, not the account owner. Only user
 * metadata crosses the wire — tokens stay server-side.
 */
export function registerUserRoutes(app: FastifyInstance, c: Container): void {
  app.get('/api/users', async () => {
    const { users, activeUuid } = await c.contentIdentity.list();
    return {
      activeUuid,
      users: users.map((u) => ({
        uuid: u.uuid,
        title: u.title,
        admin: u.admin,
        thumb: u.thumb ?? null,
      })),
    };
  });

  app.post('/api/users/active', async (req) => {
    const { uuid } = activeBodySchema.parse(req.body);
    await c.contentIdentity.setActive(uuid);
    return { ok: true };
  });
}
