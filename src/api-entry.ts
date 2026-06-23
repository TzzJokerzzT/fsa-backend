import type { Hono } from 'hono';

let app: Hono | null = null;
let initError: string | null = null;

async function getApp(): Promise<Hono> {
  if (initError) throw new Error(initError);
  if (app) return app;

  try {
    const { createApp } = await import('../src/app');
    const { loadEnv } = await import('../src/shared/config/env');
    const { connectDatabase } = await import(
      '../src/infrastructure/persistence/mongodb/connection'
    );

    const env = loadEnv();
    await connectDatabase(env.MONGODB_URI);
    app = createApp(env);
    return app;
  } catch (err) {
    initError = err instanceof Error ? err.message : String(err);
    throw err;
  }
}

// Vercel expects a default export with a fetch method
const handler = {
  async fetch(request: Request) {
    try {
      const honoApp = await getApp();
      return honoApp.fetch(request);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(
        JSON.stringify({
          error: 'Server initialization failed',
          detail: message,
        }),
        {
          status: 500,
          headers: { 'content-type': 'application/json' },
        },
      );
    }
  },
};

export default handler;
