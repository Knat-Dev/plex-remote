import type { FastifyInstance } from 'fastify';
import type { Container } from '../../../container.js';
import type { MediaType } from '../../../domain/entities/MediaItem.js';
import type {
  NavigationAction,
  PlaybackCommand,
} from '../../../domain/ports/PlayerController.js';
import { playerDto } from '../mappers/dto.js';
import { oneOf, requireNumber, requireString } from '../validate.js';

const PLAYBACK_COMMANDS: readonly PlaybackCommand[] = [
  'play', 'pause', 'stop', 'skipNext', 'skipPrevious', 'stepForward', 'stepBack',
];
const NAVIGATION_ACTIONS: readonly NavigationAction[] = [
  'moveUp', 'moveDown', 'moveLeft', 'moveRight', 'select', 'back', 'home',
];
const MEDIA_TYPES: readonly MediaType[] = [
  'movie', 'show', 'season', 'episode', 'artist', 'album', 'track', 'collection',
];

type IdParams = { clientId: string };

export function registerPlayerRoutes(app: FastifyInstance, c: Container): void {
  app.get('/api/players', async () => {
    const players = await c.discoverPlayers.execute();
    return players.map(playerDto);
  });

  app.get<{ Params: IdParams }>('/api/players/:clientId/state', async (req) => {
    return c.controlPlayback.state(req.params.clientId);
  });

  app.post<{ Params: IdParams; Body: Record<string, unknown> }>(
    '/api/players/:clientId/cast',
    async (req, reply) => {
      const body = req.body ?? {};
      await c.castMedia.execute({
        clientId: req.params.clientId,
        serverId: requireString(body.serverId, 'serverId'),
        ratingKey: requireString(body.ratingKey, 'ratingKey'),
        mediaType: oneOf(body.mediaType, MEDIA_TYPES, 'mediaType'),
      });
      return reply.code(202).send({ accepted: true });
    },
  );

  app.post<{ Params: IdParams; Body: Record<string, unknown> }>(
    '/api/players/:clientId/playback',
    async (req) => {
      const command = oneOf(req.body?.command, PLAYBACK_COMMANDS, 'command');
      await c.controlPlayback.playback(req.params.clientId, command);
      return { ok: true };
    },
  );

  app.post<{ Params: IdParams; Body: Record<string, unknown> }>(
    '/api/players/:clientId/navigate',
    async (req) => {
      const action = oneOf(req.body?.action, NAVIGATION_ACTIONS, 'action');
      await c.controlPlayback.navigate(req.params.clientId, action);
      return { ok: true };
    },
  );

  app.post<{ Params: IdParams; Body: Record<string, unknown> }>(
    '/api/players/:clientId/volume',
    async (req) => {
      const level = requireNumber(req.body?.level, 'level', 0, 100);
      await c.controlPlayback.setVolume(req.params.clientId, level);
      return { ok: true };
    },
  );

  app.post<{ Params: IdParams; Body: Record<string, unknown> }>(
    '/api/players/:clientId/seek',
    async (req) => {
      const offsetMs = requireNumber(req.body?.offsetMs, 'offsetMs', 0, 24 * 3600 * 1000);
      await c.controlPlayback.seek(req.params.clientId, offsetMs);
      return { ok: true };
    },
  );
}
