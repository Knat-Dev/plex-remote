import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import type { WebSocket } from 'ws';
import { z } from 'zod';
import type { Container } from '../../container.js';
import { playerDto } from './mappers/dto.js';

const clientMessageSchema = z.object({
  type: z.literal('watch'),
  /** Player to stream state for; null stops the current stream. */
  clientId: z.string().min(1).nullable(),
});

/**
 * The realtime channel: one multiplexed WebSocket per UI client.
 * Server → client: {type:'players', players} on registration changes and
 * {type:'state', clientId, state} for the watched player.
 * Client → server: {type:'watch', clientId} to pick the player to stream.
 */
export async function registerRealtime(app: FastifyInstance, c: Container): Promise<void> {
  await app.register(websocket);

  app.get('/api/ws', { websocket: true }, (socket: WebSocket) => {
    const send = (payload: unknown) => {
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(payload));
    };

    send({ type: 'players', players: c.playersWatcher.snapshot().map(playerDto) });
    const unsubscribePlayers = c.playersWatcher.subscribe((players) =>
      send({ type: 'players', players: players.map(playerDto) }),
    );

    let unwatch: (() => void) | undefined;
    socket.on('message', (raw: Buffer) => {
      let message;
      try {
        message = clientMessageSchema.parse(JSON.parse(raw.toString()));
      } catch {
        return; // Ignore malformed frames.
      }
      unwatch?.();
      unwatch = undefined;
      if (message.clientId) {
        const clientId = message.clientId;
        unwatch = c.playbackWatchers.watch(clientId, (state) =>
          send({ type: 'state', clientId, state }),
        );
      }
    });

    socket.on('close', () => {
      unsubscribePlayers();
      unwatch?.();
    });
  });
}
