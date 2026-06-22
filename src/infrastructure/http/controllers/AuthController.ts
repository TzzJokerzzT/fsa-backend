import type { Context } from 'hono';
import { RegisterUser } from '../../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../../application/use-cases/auth/LoginUser';
import { RefreshToken } from '../../../application/use-cases/auth/RefreshToken';
import { LogoutUser } from '../../../application/use-cases/auth/LogoutUser';
import type { UserRepository } from '../../../domain/repositories/UserRepository';
import type { PasswordService } from '../../../application/services/PasswordService';
import type { JwtService } from '../../../application/services/TokenService';
import { getValidatedData } from '../middlewares/validation.middleware';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from '../../../shared/validation/schemas/auth.schema';

export class AuthController {
  private registerUser: RegisterUser;
  private loginUser: LoginUser;
  private refreshToken: RefreshToken;
  private logoutUser: LogoutUser;

  constructor(
    userRepository: UserRepository,
    passwordService: PasswordService,
    jwtService: JwtService
  ) {
    this.registerUser = new RegisterUser(userRepository, passwordService);
    this.loginUser = new LoginUser(userRepository, passwordService, jwtService);
    this.refreshToken = new RefreshToken(userRepository, passwordService, jwtService);
    this.logoutUser = new LogoutUser(userRepository);
  }

  async register(c: Context) {
    const input = getValidatedData<RegisterInput>(c);
    const result = await this.registerUser.execute(input);

    if (!result.ok) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result.value, 201);
  }

  async login(c: Context) {
    const input = getValidatedData<LoginInput>(c);
    const result = await this.loginUser.execute(input);

    if (!result.ok) {
      return c.json({ error: result.error }, 401);
    }

    return c.json(result.value, 200);
  }

  async refresh(c: Context) {
    const input = getValidatedData<RefreshTokenInput>(c);
    const result = await this.refreshToken.execute(input);

    if (!result.ok) {
      return c.json({ error: result.error }, 401);
    }

    return c.json(result.value, 200);
  }

  async logout(c: Context) {
    const userId = c.get('userId');
    const result = await this.logoutUser.execute(userId);

    if (!result.ok) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ message: 'Sesion cerrada exitosamente' }, 200);
  }
}
