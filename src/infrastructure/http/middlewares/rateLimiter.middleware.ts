import type { MiddlewareHandler, Context } from 'hono';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

// In-memory store (usar Redis en produccion)
const store = new Map<string, RateLimitStore>();

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo
  maxRequests: number; // Max requests por ventana
  keyGenerator?: (c: Context) => string;
}

function getClientIP(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  );
}

export function rateLimiter(config: RateLimitConfig): MiddlewareHandler {
  const { windowMs, maxRequests, keyGenerator } = config;

  return async (c, next) => {
    const key = keyGenerator?.(c) ?? getClientIP(c);
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      store.set(key, record);
    }

    record.count++;

    // Headers informativos
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header(
      'X-RateLimit-Remaining',
      String(Math.max(0, maxRequests - record.count))
    );
    c.header('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

    if (record.count > maxRequests) {
      c.header('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
      return c.json({ error: 'Too many requests' }, 429);
    }

    await next();
  };
}

// Rate limits por endpoint
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 intentos de login
});

export const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100, // 100 requests
});

export const strictRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 3, // 3 intentos (password reset, etc.)
});
