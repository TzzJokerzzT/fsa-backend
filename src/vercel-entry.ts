import { Hono } from "hono";
import { loadEnv } from "@/shared/config/env.ts";
import { connectDatabase } from "@/infrastructure/persistence/mongodb/connection.ts";
import { createApp } from "@/app.ts";

const env = loadEnv();

// The real Hono application with all routes configured
const realApp = createApp(env);

// Vercel wrapper: handles the __path query parameter from rewrites.
// Vercel rewrites /api/* to /api/index?__path=<subpath>, so we recover
// the original path and route internally.
const vercelApp = new Hono();

vercelApp.use("*", async (c, next) => {
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

// Connect to database on cold start
await connectDatabase(env.MONGODB_URI);

export default vercelApp;
