import type { Environment } from '../../config/environment.js';

/**
 * Standard Plex client identification headers. Sending these consistently is
 * what lets a server accept our companion commands (a missing device name
 * yields HTTP 400 from the relay).
 */
export function plexHeaders(env: Environment, token: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'X-Plex-Token': token,
    'X-Plex-Client-Identifier': env.controllerId,
    'X-Plex-Device-Name': env.controllerName,
    'X-Plex-Product': env.controllerName,
    'X-Plex-Version': '1.0',
    'X-Plex-Platform': 'Web',
    'X-Plex-Provides': 'controller',
  };
}

export function targetHeader(clientId: string): Record<string, string> {
  return { 'X-Plex-Target-Client-Identifier': clientId };
}
