import type { MiddlewareHandler } from 'hono';
import { secureHeaders } from 'hono/secure-headers';

export const securityHeaders: MiddlewareHandler = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
});

// Sanitizacion de input
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    // Eliminar caracteres de control excepto whitespace comun
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [k, sanitizeInput(v)])
    );
  }
  return input;
}

// Proteccion contra Mass Assignment
export function allowedFields<T extends object>(
  allowed: (keyof T)[]
): (body: Record<string, unknown>) => Partial<T> {
  const allowedSet = new Set(allowed as string[]);
  return (body) => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedSet.has(key)) {
        result[key] = value;
      }
    }
    return result as Partial<T>;
  };
}

// Proteccion contra Timing Attacks en comparacion de tokens
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Comparar contra si mismo para mantener tiempo constante
    b = a;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0 && a.length === b.length;
}

// Account Lockout despues de intentos fallidos
export interface LockoutConfig {
  maxAttempts: number;
  lockoutDuration: number; // ms
}

export class AccountLockout {
  constructor(private config: LockoutConfig) {}

  shouldLock(failedAttempts: number): boolean {
    return failedAttempts >= this.config.maxAttempts;
  }

  getLockoutUntil(): Date {
    return new Date(Date.now() + this.config.lockoutDuration);
  }

  isLocked(lockedUntil: Date | null): boolean {
    if (!lockedUntil) return false;
    return new Date() < lockedUntil;
  }
}
