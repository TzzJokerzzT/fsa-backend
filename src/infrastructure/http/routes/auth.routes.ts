import { Hono } from 'hono';
import { AuthController } from '../controllers/AuthController.ts';
import { validate } from '../middlewares/validation.middleware.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { authRateLimit } from '../middlewares/rateLimiter.middleware.ts';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
} from '../../../shared/validation/schemas/auth.schema.ts';
import type { UserRepository } from '../../../domain/repositories/UserRepository.ts';
import type { PasswordService } from '../../../application/services/PasswordService.ts';
import type { JwtService } from '../../../application/services/TokenService.ts';

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
