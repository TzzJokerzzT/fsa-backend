import { loadEnv } from "@/shared/config/env.ts";
import { connectDatabase } from "@/infrastructure/persistence/mongodb/connection.ts";
import { createApp } from "@/app.ts";

const env = loadEnv();
const app = createApp(env);

// Connect to database on cold start.
// The connection is cached via the isConnected flag in the connection module,
// so warm starts reuse the existing connection.
await connectDatabase(env.MONGODB_URI);

// Vercel catch-all: handles all requests under /api/*
// Built via scripts/vercel-build.ts → output to api/[...path].js
// Vercel's file-based routing sends /api/* to this handler automatically.
// Hono receives the full request URL and matches routes at /api/auth, /api/users, etc.
export default app;
