import type { UserRepository } from '../../../domain/repositories/UserRepository';
import type { PasswordService } from '../../../application/services/PasswordService';
import type { RegisterInput } from '../../../shared/validation/schemas/auth.schema';
import type { RegisterResponseDTO } from '../../../application/dtos/auth.dto';
import { type Result, ok, err } from '../../../shared/utils/result';
import { User } from '../../../domain/entities/User';

export class RegisterUser {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService
  ) {}

  async execute(input: RegisterInput): Promise<Result<RegisterResponseDTO, string>> {
    // Verificar si email ya existe
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      return err('El email ya esta registrado');
    }

    // Hash del password
    const passwordHash = await this.passwordService.hash(input.password);

    // Crear usuario
    const user = User.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    // Persistir
    await this.userRepository.save(user);

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  }
}
