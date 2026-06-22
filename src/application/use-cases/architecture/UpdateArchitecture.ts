import type { ArchitectureRepository } from '../../../domain/repositories/ArchitectureRepository.ts';
import type { UpdateArchitectureInput } from '../../../shared/validation/schemas/architecture.schema.ts';
import type { ArchitectureDTO } from '../../../application/dtos/architecture.dto.ts';
import { type Result, ok, err } from '../../../shared/utils/result.ts';

export class UpdateArchitecture {
  constructor(private architectureRepository: ArchitectureRepository) {}

  async execute(
    userId: string,
    architectureId: string,
    input: UpdateArchitectureInput
  ): Promise<Result<ArchitectureDTO, string>> {
    const architecture = await this.architectureRepository.findById(architectureId);

    if (!architecture) {
      return err('Arquitectura no encontrada');
    }

    if (!architecture.isOwnedBy(userId)) {
      return err('No autorizado');
    }

    // Actualizar campos proporcionados
    if (input.name !== undefined) {
      architecture.updateName(input.name);
    }
    if (input.type !== undefined) {
      architecture.updateType(input.type);
    }
    if (input.description !== undefined) {
      architecture.updateDescription(input.description);
    }
    if (input.nodes !== undefined) {
      architecture.updateNodes(input.nodes);
    }
    if (input.edges !== undefined) {
      architecture.updateEdges(input.edges);
    }

    await this.architectureRepository.save(architecture);

    return ok(architecture.toJSON());
  }
}
