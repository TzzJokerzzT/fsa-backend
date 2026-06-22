import { Hono } from "hono";
import { loadEnv } from "../src/shared/config/env.ts";
import { connectDatabase } from "../src/infrastructure/persistence/mongodb/connection.ts";
import { createApp } from "../src/app.ts";

const env = loadEnv();

// The real Hono application with all routes configured
const realApp = createApp(env);

// Vercel wrapper: handles the __path query parameter from rewrites
const vercelApp = new Hono();

// Lazy database connection — avoids blocking module initialization on Vercel.
// connectDatabase() is idempotent (has internal isConnected guard).
let dbInit: Promise<void> | null = null;

vercelApp.use("*", async (c, next) => {
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
vercelApp.route("*", realApp);

export default vercelApp;
