import type { UserRepository } from '@/domain/repositories/UserRepository.ts';
import type { PasswordService } from '@/application/services/PasswordService.ts';
import type { UpdateUserInput } from '@/shared/validation/schemas/user.schema.ts';
import type { UserProfileDTO } from '@/application/dtos/user.dto.ts';
import { type Result, ok, err } from '@/shared/utils/result.ts';

export class UpdateUser {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService
  ) {}

  async execute(
    userId: string,
    input: UpdateUserInput
  ): Promise<Result<UserProfileDTO, string>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return err('Usuario no encontrado');
    }

    // Actualizar nombre si se proporciona
    if (input.name !== undefined) {
      user.name = input.name;
    }

    // Actualizar avatar si se proporciona
    if (input.avatar !== undefined) {
      user.avatar = input.avatar;
    }

    // Cambiar password si se proporciona
    if (input.newPassword && input.currentPassword) {
      const isValidPassword = await this.passwordService.verify(
        user.passwordHash,
        input.currentPassword
      );

      if (!isValidPassword) {
        return err('Password actual incorrecto');
      }

      user.passwordHash = await this.passwordService.hash(input.newPassword);
    }

    await this.userRepository.save(user);

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
