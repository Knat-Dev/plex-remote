import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Immutable runtime configuration, resolved once from the environment.
 * Secrets are never placed here — the token is resolved lazily by TokenProvider.
 */
export interface Environment {
  readonly httpPort: number;
  readonly host: string;
  readonly controllerId: string;
  readonly controllerName: string;
  readonly primaryServerUrl: string;
  readonly preferencesPath: string;
  readonly explicitToken: string | undefined;
  readonly requestTimeoutMs: number;
  readonly webDistPath: string | undefined;
  /** IPv4 CIDRs permitted to reach the API. Defaults to RFC1918 + loopback. */
  readonly lanAllowedCidrs: readonly string[];
}

/** Private LAN ranges only — deliberately excludes Tailscale's 100.64.0.0/10. */
const DEFAULT_LAN_CIDRS = ['127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

const DEFAULT_PREFERENCES = join(
  homedir(),
  'arr-stack/plex/config/Library/Application Support/Plex Media Server/Preferences.xml',
);

export function loadEnvironment(env: NodeJS.ProcessEnv = process.env): Environment {
  return {
    // 31400: Plex-adjacent, below the ephemeral range, and clear of every port
    // the arr-stack publishes (3000-3007, 808x, 8989, 7878, 9696, …).
    httpPort: toInt(env.PORT, 31400),
    host: env.HOST ?? '0.0.0.0',
    // A fresh identity each process guarantees an empty command high-water mark
    // on the Plex side, so small commandIDs are always accepted (see
    // CommandSequence). An explicit CONTROLLER_ID opts into a stable identity.
    controllerId: env.CONTROLLER_ID ?? `plex-remote-${randomUUID().slice(0, 8)}`,
    controllerName: env.CONTROLLER_NAME ?? 'Plex Remote',
    primaryServerUrl: env.PLEX_SERVER_URL ?? 'http://127.0.0.1:32400',
    preferencesPath: env.PLEX_PREFERENCES_PATH ?? DEFAULT_PREFERENCES,
    explicitToken: env.PLEX_TOKEN,
    requestTimeoutMs: toInt(env.PLEX_TIMEOUT_MS, 10_000),
    webDistPath: env.WEB_DIST_PATH,
    lanAllowedCidrs: env.LAN_ALLOWED_CIDRS
      ? env.LAN_ALLOWED_CIDRS.split(',').map((c) => c.trim()).filter(Boolean)
      : DEFAULT_LAN_CIDRS,
  };
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
