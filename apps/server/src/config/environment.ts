import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';

const DEFAULT_PREFERENCES = join(
  homedir(),
  'arr-stack/plex/config/Library/Application Support/Plex Media Server/Preferences.xml',
);

/** Private LAN ranges only — deliberately excludes Tailscale's 100.64.0.0/10. */
const DEFAULT_LAN_CIDRS = ['127.0.0.0/8', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

const envSchema = z.object({
  // 31400: Plex-adjacent, below the ephemeral range, and clear of every port
  // the arr-stack publishes (3000-3007, 808x, 8989, 7878, 9696, …).
  PORT: z.coerce.number().int().min(1).max(65535).default(31400),
  HOST: z.string().default('0.0.0.0'),
  // A fresh identity each process guarantees an empty command high-water mark
  // on the Plex side, so small commandIDs are always accepted (see
  // CommandSequence). An explicit CONTROLLER_ID opts into a stable identity.
  CONTROLLER_ID: z.string().default(() => `plex-remote-${randomUUID().slice(0, 8)}`),
  CONTROLLER_NAME: z.string().default('Plex Remote'),
  PLEX_SERVER_URL: z.url().default('http://127.0.0.1:32400'),
  PLEX_PREFERENCES_PATH: z.string().default(DEFAULT_PREFERENCES),
  PLEX_TOKEN: z.string().optional(),
  PLEX_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  WEB_DIST_PATH: z.string().optional(),
  LAN_ALLOWED_CIDRS: z
    .string()
    .transform((raw) => raw.split(',').map((c) => c.trim()).filter(Boolean))
    .optional(),
});

/** Immutable runtime configuration, resolved and validated once at startup. */
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

export function loadEnvironment(env: NodeJS.ProcessEnv = process.env): Environment {
  const parsed = envSchema.parse(env);
  return {
    httpPort: parsed.PORT,
    host: parsed.HOST,
    controllerId: parsed.CONTROLLER_ID,
    controllerName: parsed.CONTROLLER_NAME,
    primaryServerUrl: parsed.PLEX_SERVER_URL,
    preferencesPath: parsed.PLEX_PREFERENCES_PATH,
    explicitToken: parsed.PLEX_TOKEN,
    requestTimeoutMs: parsed.PLEX_TIMEOUT_MS,
    webDistPath: parsed.WEB_DIST_PATH,
    lanAllowedCidrs: parsed.LAN_ALLOWED_CIDRS ?? DEFAULT_LAN_CIDRS,
  };
}
