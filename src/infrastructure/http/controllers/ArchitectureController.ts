import type { Context } from 'hono';
import { CreateArchitecture } from '../../../application/use-cases/architecture/CreateArchitecture';
import { UpdateArchitecture } from '../../../application/use-cases/architecture/UpdateArchitecture';
import { DeleteArchitecture } from '../../../application/use-cases/architecture/DeleteArchitecture';
import { GetArchitecture } from '../../../application/use-cases/architecture/GetArchitecture';
import { ListUserArchitectures } from '../../../application/use-cases/architecture/ListUserArchitectures';
import type { ArchitectureRepository } from '../../../domain/repositories/ArchitectureRepository';
import { getValidatedData } from '../middlewares/validation.middleware';
import type {
  CreateArchitectureInput,
  UpdateArchitectureInput,
  PaginationInput,
} from '../../../shared/validation/schemas/architecture.schema';
import * as v from 'valibot';
import { PaginationSchema } from '../../../shared/validation/schemas/architecture.schema';

export class ArchitectureController {
  private createArchitecture: CreateArchitecture;
  private updateArchitecture: UpdateArchitecture;
  private deleteArchitecture: DeleteArchitecture;
  private getArchitecture: GetArchitecture;
  private listUserArchitectures: ListUserArchitectures;

  constructor(architectureRepository: ArchitectureRepository) {
    this.createArchitecture = new CreateArchitecture(architectureRepository);
    this.updateArchitecture = new UpdateArchitecture(architectureRepository);
    this.deleteArchitecture = new DeleteArchitecture(architectureRepository);
    this.getArchitecture = new GetArchitecture(architectureRepository);
    this.listUserArchitectures = new ListUserArchitectures(architectureRepository);
  }

  async create(c: Context) {
    const userId = c.get('userId');
    const input = getValidatedData<CreateArchitectureInput>(c);
    const result = await this.createArchitecture.execute(userId, input);

    if (!result.ok) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result.value, 201);
  }

  async update(c: Context) {
    const userId = c.get('userId');
    const architectureId = c.req.param('id');
    const input = getValidatedData<UpdateArchitectureInput>(c);

    if (!architectureId) {
      return c.json({ error: 'ID de arquitectura requerido' }, 400);
    }

    const result = await this.updateArchitecture.execute(userId, architectureId, input);

    if (!result.ok) {
      if (result.error === 'No autorizado') {
        return c.json({ error: result.error }, 403);
      }
      if (result.error === 'Arquitectura no encontrada') {
        return c.json({ error: result.error }, 404);
      }
      return c.json({ error: result.error }, 400);
    }

    return c.json(result.value, 200);
  }

  async delete(c: Context) {
    const userId = c.get('userId');
    const architectureId = c.req.param('id');

    if (!architectureId) {
      return c.json({ error: 'ID de arquitectura requerido' }, 400);
    }

    const result = await this.deleteArchitecture.execute(userId, architectureId);

    if (!result.ok) {
      if (result.error === 'No autorizado') {
        return c.json({ error: result.error }, 403);
      }
      if (result.error === 'Arquitectura no encontrada') {
        return c.json({ error: result.error }, 404);
      }
      return c.json({ error: result.error }, 400);
    }

    return c.json({ message: 'Arquitectura eliminada exitosamente' }, 200);
  }

  async getById(c: Context) {
    const userId = c.get('userId');
    const architectureId = c.req.param('id');

    if (!architectureId) {
      return c.json({ error: 'ID de arquitectura requerido' }, 400);
    }

    const result = await this.getArchitecture.execute(userId, architectureId);

    if (!result.ok) {
      if (result.error === 'No autorizado') {
        return c.json({ error: result.error }, 403);
      }
      if (result.error === 'Arquitectura no encontrada') {
        return c.json({ error: result.error }, 404);
      }
      return c.json({ error: result.error }, 400);
    }

    return c.json(result.value, 200);
  }

  async list(c: Context) {
    const userId = c.get('userId');
    const query = c.req.query();

    // Parse pagination from query params
    const paginationResult = v.safeParse(PaginationSchema, query);
    const pagination: PaginationInput = paginationResult.success
      ? paginationResult.output
      : { page: 1, limit: 20 };

    const result = await this.listUserArchitectures.execute(userId, pagination);

    if (!result.ok) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result.value, 200);
  }
}
