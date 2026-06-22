import type { Context } from 'hono';
import { GetUserProfile } from '../../../application/use-cases/user/GetUserProfile';
import { UpdateUser } from '../../../application/use-cases/user/UpdateUser';
import { DeleteUser } from '../../../application/use-cases/user/DeleteUser';
import type { UserRepository } from '../../../domain/repositories/UserRepository';
import type { ArchitectureRepository } from '../../../domain/repositories/ArchitectureRepository';
import type { PasswordService } from '../../../application/services/PasswordService';
import { getValidatedData } from '../middlewares/validation.middleware';
import type { UpdateUserInput } from '../../../shared/validation/schemas/user.schema';

export class UserController {
  private getUserProfile: GetUserProfile;
  private updateUser: UpdateUser;
  private deleteUser: DeleteUser;

  constructor(
    userRepository: UserRepository,
    architectureRepository: ArchitectureRepository,
    passwordService: PasswordService
  ) {
    this.getUserProfile = new GetUserProfile(userRepository);
    this.updateUser = new UpdateUser(userRepository, passwordService);
    this.deleteUser = new DeleteUser(userRepository, architectureRepository);
  }

  async getMe(c: Context) {
    const userId = c.get('userId');
    const result = await this.getUserProfile.execute(userId);

    if (!result.ok) {
      return c.json({ error: result.error }, 404);
    }

    return c.json(result.value, 200);
  }

  async updateMe(c: Context) {
    const userId = c.get('userId');
    const input = getValidatedData<UpdateUserInput>(c);
    const result = await this.updateUser.execute(userId, input);

    if (!result.ok) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result.value, 200);
  }

  async deleteMe(c: Context) {
    const userId = c.get('userId');
    const result = await this.deleteUser.execute(userId);

    if (!result.ok) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ message: 'Cuenta eliminada exitosamente' }, 200);
  }
}
