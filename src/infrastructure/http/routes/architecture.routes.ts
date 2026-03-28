import { Hono } from 'hono';
import { ArchitectureController } from '../controllers/ArchitectureController.ts';
import { validate } from '../middlewares/validation.middleware.ts';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import {
  CreateArchitectureSchema,
  UpdateArchitectureSchema,
} from '@/shared/validation/schemas/architecture.schema.ts';
import type { ArchitectureRepository } from '@/domain/repositories/ArchitectureRepository.ts';
import type { JwtService } from '@/application/services/TokenService.ts';

export function createArchitectureRoutes(
  architectureRepository: ArchitectureRepository,
  jwtService: JwtService
): Hono {
  const router = new Hono();
  const controller = new ArchitectureController(architectureRepository);

  // All routes require authentication
  router.use('*', authMiddleware(jwtService));

  // GET /api/architectures
  router.get('/', (c) => controller.list(c));

  // POST /api/architectures
  router.post('/', validate(CreateArchitectureSchema), (c) => controller.create(c));

  // GET /api/architectures/:id
  router.get('/:id', (c) => controller.getById(c));

  // PUT /api/architectures/:id
  router.put('/:id', validate(UpdateArchitectureSchema), (c) => controller.update(c));

  // DELETE /api/architectures/:id
  router.delete('/:id', (c) => controller.delete(c));

  return router;
}
