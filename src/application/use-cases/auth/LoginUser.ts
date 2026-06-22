import type { UserRepository } from "../../../domain/repositories/UserRepository.ts";
import type { PasswordService } from "../../services/PasswordService.ts";
import type { JwtService } from "../../services/TokenService.ts";
import type { LoginInput } from "../../../shared/validation/schemas/auth.schema.ts";
import type { LoginResponseDTO } from "../../dtos/auth.dto.ts";
import { type Result, ok, err } from "../../../shared/utils/result.ts";
import { AccountLockout } from "../../../infrastructure/http/middlewares/security.middleware.ts";

export class LoginUser {
  private lockout = new AccountLockout({
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos
  });

  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private jwtService: JwtService,
  ) {}

  async execute(input: LoginInput): Promise<Result<LoginResponseDTO, string>> {
    const user = await this.userRepository.findByEmail(input.email);

    // Respuesta generica para evitar enumeracion de usuarios
    const genericError = "Email or password incorrect";

    if (!user) {
      // Ejecutar hash dummy para evitar timing attack
      await this.passwordService.hash(input.password);
      return err(genericError);
    }

    // Verificar lockout
    if (this.lockout.isLocked(user.lockedUntil)) {
      return err("Cuenta bloqueada temporalmente. Intente mas tarde.");
    }

    // Verificar password
    const isValid = await this.passwordService.verify(
      user.passwordHash,
      input.password,
    );

    if (!isValid) {
      // Incrementar intentos fallidos
      user.incrementFailedAttempts();

      if (this.lockout.shouldLock(user.failedLoginAttempts)) {
        user.lockedUntil = this.lockout.getLockoutUntil();
      }

      await this.userRepository.save(user);
      return err(genericError);
    }

    // Login exitoso: resetear intentos
    user.resetLoginAttempts();

    // Generar tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.generateAccessToken(user.id),
      this.jwtService.generateRefreshToken(user.id),
    ]);

    // Guardar hash del refresh token
    user.refreshTokenHash = await this.passwordService.hash(refreshToken);
    await this.userRepository.save(user);

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  }
}
