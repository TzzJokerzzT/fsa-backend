import type { UserRepository } from '@/domain/repositories/UserRepository.ts';
import type { UserProfileDTO } from '@/application/dtos/user.dto.ts';
import { type Result, ok, err } from '@/shared/utils/result.ts';

export class GetUserProfile {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string): Promise<Result<UserProfileDTO, string>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return err('Usuario no encontrado');
    }

    return ok({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
