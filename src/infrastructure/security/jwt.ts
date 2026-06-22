import * as jose from 'jose';
import type { Env } from '../../shared/config/env.ts';

export interface TokenPayload {
  sub: string; // userId
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export class JwtService {
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;

  constructor(env: Env) {
    this.accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
    this.refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  }

  async generateAccessToken(userId: string): Promise<string> {
    return new jose.SignJWT({ sub: userId, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m') // 15 minutos
      .sign(this.accessSecret);
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return new jose.SignJWT({ sub: userId, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 dias
      .sign(this.refreshSecret);
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jose.jwtVerify(token, this.accessSecret);
      if (payload.type !== 'access') return null;
      return payload as unknown as TokenPayload;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jose.jwtVerify(token, this.refreshSecret);
      if (payload.type !== 'refresh') return null;
      return payload as unknown as TokenPayload;
    } catch {
      return null;
    }
  }
}
