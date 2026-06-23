import { createApp } from './app';
import { loadEnv } from './shared/config/env';
import { connectDatabase } from './infrastructure/persistence/mongodb/connection';

let app: ReturnType<typeof createApp> | null = null;

export default {
  async fetch(request: Request) {
    if (!app) {
      const env = loadEnv();
      await connectDatabase(env.MONGODB_URI);
      app = createApp(env);
    }
    return app.fetch(request);
  },
};
