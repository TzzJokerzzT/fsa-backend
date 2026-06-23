import { createApp } from '../src/app';
import { loadEnv } from '../src/shared/config/env';
import { connectDatabase } from '../src/infrastructure/persistence/mongodb/connection';

const env = loadEnv();
let app: ReturnType<typeof createApp>;

export default {
  async fetch(request: Request) {
    if (!app) {
      await connectDatabase(env.MONGODB_URI);
      app = createApp(env);
    }
    return app.fetch(request);
  },
};
