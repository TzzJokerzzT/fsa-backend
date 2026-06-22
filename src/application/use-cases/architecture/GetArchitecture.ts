import type { ArchitectureRepository } from '../../../domain/repositories/ArchitectureRepository';
import type { ArchitectureDTO } from '../../../application/dtos/architecture.dto';
import { type Result, ok, err } from '../../../shared/utils/result';

export class GetArchitecture {
  constructor(private architectureRepository: ArchitectureRepository) {}

  async execute(
    userId: string,
    architectureId: string
  ): Promise<Result<ArchitectureDTO, string>> {
    const architecture = await this.architectureRepository.findById(architectureId);

    if (!architecture) {
      return err('Arquitectura no encontrada');
    }

    // Solo el dueño puede ver sus arquitecturas (a menos que sea pública)
    if (!architecture.isOwnedBy(userId) && !architecture.isPublic) {
      return err('No autorizado');
    }

    return ok(architecture.toJSON());
  }
}
