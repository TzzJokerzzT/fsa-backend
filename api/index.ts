import { Hono } from "hono";
import { loadEnv } from "../src/shared/config/env";
import { connectDatabase } from "../src/infrastructure/persistence/mongodb/connection";
import { createApp } from "../src/app";

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

const app = new Hono();

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error", message: err instanceof Error ? err.message : String(err) }, 500);
});

let dbConnected = false;
let dbError: string | null = null;

async function ensureDb() {
  if (!env) throw new Error("Env not initialized");
  if (dbConnected) return;
  if (dbError) throw new Error(dbError);
  try {
    await connectDatabase(env.MONGODB_URI);
    dbConnected = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
    throw err;
  }
}

app.use("*", async (c, next) => {
  if (initError || !realApp || !env) {
    return c.json({ error: "Config error", detail: initError }, 500);
  }
  try { await ensureDb(); } catch (err) {
    return c.json({ error: "DB connection failed", detail: dbError }, 503);
  }
  await next();
});

if (realApp) app.route("*", realApp);

export default app;
