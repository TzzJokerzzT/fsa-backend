import { Hono } from "hono";
import { loadEnv } from '../src/shared/config/env';
import { connectDatabase } from '../src/infrastructure/persistence/mongodb/connection';
import { createApp } from '../src/app';

// Wrap initialization so missing env vars don't crash the function
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

// Global error handler — prevents any unhandled error from crashing the function
vercelApp.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({
    error: "Internal server error",
    message: err instanceof Error ? err.message : String(err),
  }, 500);
});

// Lazy database connection
let dbConnected = false;
let dbError: string | null = null;

async function ensureDb(): Promise<void> {
  if (!env) throw new Error("Env not initialized");
  if (dbConnected) return;
  if (dbError) throw new Error(dbError);
  
  try {
    await connectDatabase(env.MONGODB_URI);
    dbConnected = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
    console.error("DB connection failed:", dbError);
    throw err;
  }
}

vercelApp.use("*", async (c, next) => {
  // If initialization failed, return the error
  if (initError || !realApp || !env) {
    return c.json({
      error: "Server configuration error",
      detail: initError,
      hint: "Check environment variables in Vercel dashboard",
    }, 500);
  }

  // Connect to DB (lazy, with error handling)
  try {
    await ensureDb();
  } catch (err) {
    return c.json({
      error: "Database connection failed",
      detail: dbError || (err instanceof Error ? err.message : String(err)),
    }, 503);
  }

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
