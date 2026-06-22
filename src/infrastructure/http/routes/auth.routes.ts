import { Hono } from 'hono';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimit } from '../middlewares/rateLimiter.middleware';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
} from '../../../shared/validation/schemas/auth.schema';
import type { UserRepository } from '../../../domain/repositories/UserRepository';
import type { PasswordService } from '../../../application/services/PasswordService';
import type { JwtService } from '../../../application/services/TokenService';

export function createAuthRoutes(
  userRepository: UserRepository,
  passwordService: PasswordService,
  jwtService: JwtService
): Hono {
  const router = new Hono();
  const controller = new AuthController(userRepository, passwordService, jwtService);

  // POST /api/auth/register
  router.post(
    '/register',
    authRateLimit,
    validate(RegisterSchema),
    (c) => controller.register(c)
  );

  // POST /api/auth/login
  router.post(
    '/login',
    authRateLimit,
    validate(LoginSchema),
    (c) => controller.login(c)
  );

  // POST /api/auth/refresh
  router.post('/refresh', validate(RefreshTokenSchema), (c) => controller.refresh(c));

  // POST /api/auth/logout
  router.post('/logout', authMiddleware(jwtService), (c) => controller.logout(c));

  return router;
}
