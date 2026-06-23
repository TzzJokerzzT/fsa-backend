import { createApp } from '../src/app';
import { loadEnv } from '../src/shared/config/env';
import { connectDatabase } from '../src/infrastructure/persistence/mongodb/connection';

let app: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (app) return app;
  const env = loadEnv();
  await connectDatabase(env.MONGODB_URI);
  app = createApp(env);
  return app;
}

export default async function handler(request: Request) {
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
}
