import type { ArchitectureRepository } from '../../../domain/repositories/ArchitectureRepository';
import { type Result, ok, err } from '../../../shared/utils/result';

export class DeleteArchitecture {
  constructor(private architectureRepository: ArchitectureRepository) {}

  async execute(userId: string, architectureId: string): Promise<Result<void, string>> {
    const architecture = await this.architectureRepository.findById(architectureId);

    if (!architecture) {
      return err('Arquitectura no encontrada');
    }

    if (!architecture.isOwnedBy(userId)) {
      return err('No autorizado');
    }

    await this.architectureRepository.delete(architectureId);

    return ok(undefined);
  }
}
