import { Hono } from 'hono';
import { ArchitectureController } from '../controllers/ArchitectureController';
import { validate } from '../middlewares/validation.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  CreateArchitectureSchema,
  UpdateArchitectureSchema,
} from '../../../shared/validation/schemas/architecture.schema';
import type { ArchitectureRepository } from '../../../domain/repositories/ArchitectureRepository';
import type { JwtService } from '../../../application/services/TokenService';

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
