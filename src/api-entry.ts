export default {
  async fetch() {
    try {
      const { loadEnv } = await import('../src/shared/config/env');
      const env = loadEnv();
      return new Response(JSON.stringify({ ok: true, cors: env.CORS_ORIGIN }), {
        headers: { 'content-type': 'application/json' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
};
