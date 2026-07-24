import { loadEnvironment } from './config/environment.js';
import { createContainer } from './container.js';
import { buildHttpServer } from './interface/http/httpServer.js';

/** Process entry point: load config, wire the graph, start listening. */
async function main(): Promise<void> {
  const env = loadEnvironment();
  const container = createContainer(env);
  const app = await buildHttpServer(env, container);

  await app.listen({ host: env.host, port: env.httpPort });

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      app.log.info(`Received ${signal}, shutting down`);
      void app.close().then(() => process.exit(0));
    });
  }
}

main().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
