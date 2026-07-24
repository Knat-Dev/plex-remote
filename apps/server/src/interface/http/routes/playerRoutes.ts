import type { FastifyInstance } from 'fastify';
import type { Container } from '../../../container.js';
import { playerDto } from '../mappers/dto.js';
import {
  castBodySchema,
  navigationActionSchema,
  playbackCommandSchema,
  seekBodySchema,
  volumeBodySchema,
} from '../schemas.js';

type IdParams = { clientId: string };

export function registerPlayerRoutes(app: FastifyInstance, c: Container): void {
  app.get('/api/players', async () => {
    const players = await c.discoverPlayers.execute();
    return players.map(playerDto);
  });

  app.get<{ Params: IdParams }>('/api/players/:clientId/state', async (req) => {
    return c.controlPlayback.state(req.params.clientId);
  });

  app.post<{ Params: IdParams }>('/api/players/:clientId/cast', async (req, reply) => {
    const body = castBodySchema.parse(req.body);
    await c.castMedia.execute({ clientId: req.params.clientId, ...body });
    return reply.code(202).send({ accepted: true });
  });

  app.post<{ Params: IdParams }>('/api/players/:clientId/playback', async (req) => {
    const { command } = playbackCommandSchema.parse(req.body);
    await c.controlPlayback.playback(req.params.clientId, command);
    return { ok: true };
  });

  app.post<{ Params: IdParams }>('/api/players/:clientId/navigate', async (req) => {
    const { action } = navigationActionSchema.parse(req.body);
    await c.controlPlayback.navigate(req.params.clientId, action);
    return { ok: true };
  });

  app.post<{ Params: IdParams }>('/api/players/:clientId/volume', async (req) => {
    const { level } = volumeBodySchema.parse(req.body);
    await c.controlPlayback.setVolume(req.params.clientId, level);
    return { ok: true };
  });

  app.post<{ Params: IdParams }>('/api/players/:clientId/seek', async (req) => {
    const { offsetMs } = seekBodySchema.parse(req.body);
    await c.controlPlayback.seek(req.params.clientId, offsetMs);
    return { ok: true };
  });
}
