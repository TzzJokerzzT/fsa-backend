import { Hono } from 'hono';
import { UserController } from '../controllers/UserController.ts';
import { validate } from '../middlewares/validation.middleware.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { UpdateUserSchema } from '@/shared/validation/schemas/user.schema.ts';
import type { UserRepository } from '@/domain/repositories/UserRepository.ts';
import type { ArchitectureRepository } from '@/domain/repositories/ArchitectureRepository.ts';
import type { PasswordService } from '@/application/services/PasswordService.ts';
import type { JwtService } from '@/application/services/TokenService.ts';

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
