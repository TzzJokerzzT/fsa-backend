import { Hono } from 'hono';
import { UserController } from '../controllers/UserController';
import { validate } from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { UpdateUserSchema } from '../../../shared/validation/schemas/user.schema';
import type { UserRepository } from '../../../domain/repositories/UserRepository';
import type { ArchitectureRepository } from '../../../domain/repositories/ArchitectureRepository';
import type { PasswordService } from '../../../application/services/PasswordService';
import type { JwtService } from '../../../application/services/TokenService';

export function createUserRoutes(
  userRepository: UserRepository,
  architectureRepository: ArchitectureRepository,
  passwordService: PasswordService,
  jwtService: JwtService
): Hono {
  const router = new Hono();
  const controller = new UserController(
    userRepository,
    architectureRepository,
    passwordService
  );

  // All routes require authentication
  router.use('*', authMiddleware(jwtService));

  // GET /api/users/me
  router.get('/me', (c) => controller.getMe(c));

  // PATCH /api/users/me
  router.patch('/me', validate(UpdateUserSchema), (c) => controller.updateMe(c));

  // DELETE /api/users/me
  router.delete('/me', (c) => controller.deleteMe(c));

  return router;
}
