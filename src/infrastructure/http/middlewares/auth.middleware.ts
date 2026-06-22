import type { MiddlewareHandler } from 'hono';
import type { JwtService } from '../../../infrastructure/security/jwt.ts';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
  }
}

export function authMiddleware(jwtService: JwtService): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'No autorizado' }, 401);
    }

    const token = authHeader.slice(7);
    const payload = await jwtService.verifyAccessToken(token);

    if (!payload) {
      return c.json({ error: 'Token invalido o expirado' }, 401);
    }

    c.set('userId', payload.sub);
    await next();
  };
}
