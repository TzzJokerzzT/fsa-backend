import type { UserRepository } from '../../../domain/repositories/UserRepository.ts';
import type { PasswordService } from '../../../application/services/PasswordService.ts';
import type { JwtService } from '../../../application/services/TokenService.ts';
import type { RefreshTokenInput } from '../../../shared/validation/schemas/auth.schema.ts';
import type { TokensDTO } from '../../../application/dtos/auth.dto.ts';
import { type Result, ok, err } from '../../../shared/utils/result.ts';

export class RefreshToken {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private jwtService: JwtService
  ) {}

  async execute(input: RefreshTokenInput): Promise<Result<TokensDTO, string>> {
    // Verificar el refresh token
    const payload = await this.jwtService.verifyRefreshToken(input.refreshToken);

    if (!payload) {
      return err('Refresh token invalido o expirado');
    }

    // Buscar usuario
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      return err('Usuario no encontrado');
    }

    // Verificar que el refresh token coincide con el guardado
    if (!user.refreshTokenHash) {
      return err('Sesion no valida');
    }

    const isValidToken = await this.passwordService.verify(
      user.refreshTokenHash,
      input.refreshToken
    );

    if (!isValidToken) {
      return err('Refresh token invalido');
    }

    // Generar nuevos tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.generateAccessToken(user.id),
      this.jwtService.generateRefreshToken(user.id),
    ]);

    // Actualizar hash del refresh token
    user.refreshTokenHash = await this.passwordService.hash(refreshToken);
    await this.userRepository.save(user);

    return ok({
      accessToken,
      refreshToken,
    });
  }
}
