import type { ArchitectureRepository } from '../../../domain/repositories/ArchitectureRepository.ts';
import type { CreateArchitectureInput } from '../../../shared/validation/schemas/architecture.schema.ts';
import type { ArchitectureDTO } from '../../../application/dtos/architecture.dto.ts';
import { type Result, ok } from '../../../shared/utils/result.ts';
import { Architecture } from '../../../domain/entities/Architecture.ts';

export class CreateArchitecture {
  constructor(private architectureRepository: ArchitectureRepository) {}

  async execute(
    userId: string,
    input: CreateArchitectureInput
  ): Promise<Result<ArchitectureDTO, string>> {
    const architecture = Architecture.create({
      userId,
      name: input.name,
      type: input.type,
      description: input.description,
      nodes: input.nodes,
      edges: input.edges,
    });

    await this.architectureRepository.save(architecture);

    return ok(architecture.toJSON());
  }
}
