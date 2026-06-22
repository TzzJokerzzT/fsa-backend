import type { ArchitectureRepository } from '../../../domain/repositories/ArchitectureRepository';
import type { CreateArchitectureInput } from '../../../shared/validation/schemas/architecture.schema';
import type { ArchitectureDTO } from '../../../application/dtos/architecture.dto';
import { type Result, ok } from '../../../shared/utils/result';
import { Architecture } from '../../../domain/entities/Architecture';

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
