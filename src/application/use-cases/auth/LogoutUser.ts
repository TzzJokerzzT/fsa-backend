import type { UserRepository } from '../../../domain/repositories/UserRepository';
import { type Result, ok, err } from '../../../shared/utils/result';

export class LogoutUser {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string): Promise<Result<void, string>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return err('Usuario no encontrado');
    }

    // Invalidar refresh token
    user.refreshTokenHash = undefined;
    await this.userRepository.save(user);

    return ok(undefined);
  }
}
