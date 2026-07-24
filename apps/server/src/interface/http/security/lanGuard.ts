import type { FastifyInstance } from 'fastify';
import type { Environment } from '../../../config/environment.js';
import { isAllowed, parseCidr, type Cidr } from './ipRange.js';

/**
 * Rejects any request whose source address is not on the local network.
 * The check uses the raw socket address (never client-supplied forwarding
 * headers), so it cannot be spoofed by a proxy header. This is what keeps the
 * remote unusable over Tailscale or from the internet even though the process
 * may bind all interfaces.
 */
export function registerLanGuard(app: FastifyInstance, env: Environment): void {
  const cidrs: Cidr[] = env.lanAllowedCidrs.map(parseCidr);

  app.addHook('onRequest', async (req, reply) => {
    if (isAllowed(req.socket.remoteAddress, cidrs)) return;
    req.log.warn({ ip: req.socket.remoteAddress }, 'Rejected non-LAN request');
    await reply.code(403).send({ error: 'This remote is available on the local network only.' });
  });
}
