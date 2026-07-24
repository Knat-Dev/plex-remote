import ipaddr from 'ipaddr.js';
import type { FastifyInstance } from 'fastify';
import type { Environment } from '../../../config/environment.js';

type ParsedRange = [ipaddr.IPv4 | ipaddr.IPv6, number];

/**
 * Rejects any request whose source address is not on the local network.
 * The check uses the raw socket address (never client-supplied forwarding
 * headers), so it cannot be spoofed by a proxy header. This is what keeps the
 * remote unusable over Tailscale (100.64/10 is not in the allowlist) or from
 * the internet even though the process binds all interfaces.
 */
export function registerLanGuard(app: FastifyInstance, env: Environment): void {
  const ranges: ParsedRange[] = env.lanAllowedCidrs.map((cidr) => ipaddr.parseCIDR(cidr));

  app.addHook('onRequest', async (req, reply) => {
    if (isAllowed(req.socket.remoteAddress, ranges)) return;
    req.log.warn({ ip: req.socket.remoteAddress }, 'Rejected non-LAN request');
    await reply.code(403).send({ error: 'This remote is available on the local network only.' });
  });
}

function isAllowed(remoteAddress: string | undefined, ranges: ParsedRange[]): boolean {
  if (!remoteAddress || !ipaddr.isValid(remoteAddress)) return false;
  let addr = ipaddr.process(remoteAddress); // unwraps IPv4-mapped IPv6
  if (addr.kind() === 'ipv6') {
    // Only loopback IPv6 is ever local here; everything else is denied.
    return addr.range() === 'loopback';
  }
  return ranges.some(
    (range) => range[0].kind() === 'ipv4' && (addr as ipaddr.IPv4).match(range as [ipaddr.IPv4, number]),
  );
}
