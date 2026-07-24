import { z } from 'zod';

/**
 * Zod schemas for every route input. Enum whitelists double as injection
 * guards: command/action values are interpolated into Plex URL paths, so only
 * known literals may pass.
 */

export const playbackCommandSchema = z.object({
  command: z.enum([
    'play', 'pause', 'stop', 'skipNext', 'skipPrevious', 'stepForward', 'stepBack',
  ]),
});

export const navigationActionSchema = z.object({
  action: z.enum(['moveUp', 'moveDown', 'moveLeft', 'moveRight', 'select', 'back', 'home']),
});

export const castBodySchema = z.object({
  serverId: z.string().min(1),
  ratingKey: z.string().min(1),
  mediaType: z.enum([
    'movie', 'show', 'season', 'episode', 'artist', 'album', 'track', 'collection',
  ]),
  offsetMs: z.coerce.number().min(0).max(24 * 3600 * 1000).default(0),
});

export const volumeBodySchema = z.object({
  level: z.coerce.number().min(0).max(100),
});

export const seekBodySchema = z.object({
  offsetMs: z.coerce.number().min(0).max(24 * 3600 * 1000),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1),
});

export const imageQuerySchema = z.object({
  serverId: z.string().min(1),
  path: z.string().min(1),
});
