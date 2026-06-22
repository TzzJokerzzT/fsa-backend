import { Hono } from "hono";
import { loadEnv } from '../src/shared/config/env';
import { connectDatabase } from '../src/infrastructure/persistence/mongodb/connection';
import { createApp } from '../src/app';

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

vercelApp.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error", message: err instanceof Error ? err.message : String(err) }, 500);
});

// Diagnostic: show exactly what the function receives
vercelApp.all("*", async (c) => {
  // Check env vars first
  if (initError) {
    return c.json({ error: "Config error", detail: initError }, 500);
  }

  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((v, k) => { headers[k] = v; });

  return c.json({
    message: "Function is running!",
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
    headers,
  });
});

export default vercelApp;
