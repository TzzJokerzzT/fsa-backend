import { loadEnv } from "@/shared/config/env.ts";
import { connectDatabase } from "@/infrastructure/persistence/mongodb/connection.ts";
import { createApp } from "@/app.ts";

const env = loadEnv();
const app = createApp(env);

async function main() {
  await connectDatabase(env.MONGODB_URI);

  console.log(`Server running on port ${env.PORT}`);

  Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
  });
}

main().catch(console.error);
