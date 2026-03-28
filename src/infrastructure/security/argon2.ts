import { hash, verify } from 'argon2';

// OWASP recommended settings para Argon2id
const ARGON2_OPTIONS = {
  type: 2 as const, // argon2id
  memoryCost: 65536, // 64 MB
  timeCost: 3, // 3 iteraciones
  parallelism: 4, // 4 threads
};

export class PasswordService {
  async hash(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }

  async verify(hashedPassword: string, password: string): Promise<boolean> {
    try {
      return await verify(hashedPassword, password);
    } catch {
      return false;
    }
  }
}
