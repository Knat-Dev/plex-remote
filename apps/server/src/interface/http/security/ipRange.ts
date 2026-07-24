/**
 * Minimal IPv4 CIDR matching, sufficient to distinguish LAN clients from
 * Tailscale (100.64.0.0/10) and the public internet. IPv6 is only ever matched
 * for loopback (::1); every other IPv6 (including globally-routable addresses)
 * is treated as non-LAN and denied.
 */
export interface Cidr {
  readonly base: number;
  readonly bits: number;
}

export function parseCidr(text: string): Cidr {
  const [addr, prefix] = text.split('/');
  const bits = prefix === undefined ? 32 : Number(prefix);
  const base = ipv4ToInt(addr ?? '');
  if (base === undefined || bits < 0 || bits > 32) {
    throw new Error(`Invalid CIDR: ${text}`);
  }
  return { base: base & mask(bits), bits };
}

/** True when `remoteAddress` (as reported by the socket) falls in any CIDR. */
export function isAllowed(remoteAddress: string | undefined, cidrs: readonly Cidr[]): boolean {
  if (!remoteAddress) return false;
  const normalized = normalize(remoteAddress);
  if (normalized === 'loopback') return true;
  const value = ipv4ToInt(normalized);
  if (value === undefined) return false;
  return cidrs.some((cidr) => (value & mask(cidr.bits)) === cidr.base);
}

/** Reduce IPv6 loopback and IPv4-mapped IPv6 to a comparable IPv4 form. */
function normalize(address: string): string {
  if (address === '::1') return 'loopback';
  if (address.startsWith('127.')) return 'loopback';
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped?.[1]) return mapped[1];
  return address;
}

function ipv4ToInt(addr: string): number | undefined {
  const parts = addr.split('.');
  if (parts.length !== 4) return undefined;
  let value = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) return undefined;
    value = (value << 8) | octet;
  }
  return value >>> 0;
}

function mask(bits: number): number {
  return bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
}
