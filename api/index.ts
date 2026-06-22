import { Hono } from "hono";
import { loadEnv } from '../src/shared/config/env';
import { connectDatabase } from '../src/infrastructure/persistence/mongodb/connection';
import { createApp } from '../src/app';

// Wrap initialization so missing env vars don't crash the function.
// Instead, every request returns a clear error until env vars are set.
let initError: string | null = null;
let realApp: Hono | null = null;
let env: ReturnType<typeof loadEnv> | null = null;

try {
  env = loadEnv();
  realApp = createApp(env);
} catch (err) {
  initError = err instanceof Error ? err.message : String(err);
  console.error("Init failed:", initError);
}

const vercelApp = new Hono();

// Lazy database connection
let dbInit: Promise<void> | null = null;

vercelApp.use("*", async (c, next) => {
  // If initialization failed, return the error
  if (initError || !realApp || !env) {
    return c.json({ error: "Server configuration error", detail: initError }, 500);
  }

  // Connect to DB on first request (lazy init)
  if (!dbInit) {
    dbInit = connectDatabase(env.MONGODB_URI).catch((err) => {
      console.error("DB connection failed:", err);
      dbInit = null;
      throw err;
    });
  }
  await dbInit;

  const pathParam = c.req.query("__path");

  if (pathParam !== undefined) {
    // Reconstruct the original path that Vercel rewrote
    const originalPath = pathParam ? `/api/${pathParam}` : "/api";

    const url = new URL(c.req.url);
    url.pathname = originalPath;
    url.searchParams.delete("__path");

    // Forward to the real app with the corrected URL
    const newReq = new Request(url.toString(), c.req.raw);
    return realApp.fetch(newReq);
  }

  // No __path — pass through to realApp
  await next();
});

// Fallback: for requests that reach the function directly (no rewrite)
if (realApp) {
  vercelApp.route("*", realApp);
}

export default vercelApp;
