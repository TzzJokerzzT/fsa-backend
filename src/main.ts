import { loadEnv } from './shared/config/env';
import { connectDatabase } from './infrastructure/persistence/mongodb/connection';
import { createApp } from './app';

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
