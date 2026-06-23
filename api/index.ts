import type { Hono } from 'hono';

let app: Hono | null = null;

async function getApp(): Promise<Hono> {
  if (app) return app;
  const { createApp } = await import('../src/app');
  const { loadEnv } = await import('../src/shared/config/env');
  const { connectDatabase } = await import(
    '../src/infrastructure/persistence/mongodb/connection'
  );
  const env = loadEnv();
  await connectDatabase(env.MONGODB_URI);
  app = createApp(env);
  return app;
}

export default {
  async fetch(request: Request) {
    try {
      const hono = await getApp();
      return hono.fetch(request);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
};
