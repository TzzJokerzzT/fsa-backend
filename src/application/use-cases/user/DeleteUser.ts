import type { UserRepository } from '@/domain/repositories/UserRepository.ts';
import type { ArchitectureRepository } from '@/domain/repositories/ArchitectureRepository.ts';
import { type Result, ok, err } from '@/shared/utils/result.ts';

export class DeleteUser {
  constructor(
    private userRepository: UserRepository,
    private architectureRepository: ArchitectureRepository
  ) {}

  async execute(userId: string): Promise<Result<void, string>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return err('Usuario no encontrado');
    }

    // Obtener todas las arquitecturas del usuario y eliminarlas
    const architectures = await this.architectureRepository.findByUserId(userId, {
      page: 1,
      limit: 1000, // Get all
    });

    for (const arch of architectures.data) {
      await this.architectureRepository.delete(arch.id);
    }

    // Eliminar usuario
    await this.userRepository.delete(userId);

    return ok(undefined);
  }
}
