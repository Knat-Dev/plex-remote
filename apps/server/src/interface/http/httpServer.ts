import { stat } from 'node:fs/promises';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { ZodError } from 'zod';
import type { Environment } from '../../config/environment.js';
import type { Container } from '../../container.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { PlexHttpError } from '../../infrastructure/plex/PlexHttpError.js';
import { registerLanGuard } from './security/lanGuard.js';
import { registerRealtime } from './realtime.js';
import { registerPlayerRoutes } from './routes/playerRoutes.js';
import { registerLibraryRoutes } from './routes/libraryRoutes.js';
import { registerUserRoutes } from './routes/userRoutes.js';

/** Builds the Fastify app: routes, CORS, error mapping and optional web UI. */
export async function buildHttpServer(
  env: Environment,
  container: Container,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: 'info' }, disableRequestLogging: false });

  await app.register(cors, { origin: true });
  registerLanGuard(app, env);

  app.get('/api/health', async () => ({ status: 'ok' }));
  await registerRealtime(app, container);
  registerPlayerRoutes(app, container);
  registerLibraryRoutes(app, container);
  registerUserRoutes(app, container);

  await registerWebUi(app, env);
  registerErrorHandler(app);

  return app;
}

async function registerWebUi(app: FastifyInstance, env: Environment): Promise<void> {
  if (!env.webDistPath || !(await isDirectory(env.webDistPath))) return;
  await app.register(fastifyStatic, { root: env.webDistPath });
  // SPA fallback: unknown non-API routes serve index.html.
  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' });
    return reply.sendFile('index.html');
  });
}

function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: Error, _req, reply) => {
    const status = statusFor(error);
    if (status >= 500) app.log.error(error);
    return reply.code(status).send({ error: error.message });
  });
}

function statusFor(error: unknown): number {
  // An explicit statusCode wins (our domain errors carry one). This is immune
  // to the cross-module `instanceof` failures that can occur under ESM, where
  // a NotFoundError was being mapped to 500 instead of 404.
  if (
    error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number'
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  if (error instanceof ZodError) return 400;
  if (error instanceof ValidationError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof PlexHttpError) return error.status >= 500 ? 502 : error.status;
  // Name-based fallback: survives any dual-class / error-wrapping edge case.
  if (error instanceof Error) {
    if (error.name === 'NotFoundError') return 404;
    if (error.name === 'ValidationError') return 400;
    if (error.name === 'ZodError') return 400;
  }
  return 500;
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}
