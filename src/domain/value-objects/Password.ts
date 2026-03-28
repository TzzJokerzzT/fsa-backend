import { ValidationError } from '@/domain/errors/index.ts';

/**
 * Password value object with OWASP validation rules
 */
export class Password {
  private constructor(private readonly value: string) {}

  static create(password: string): Password {
    if (password.length < 12) {
      throw new ValidationError('Password must be at least 12 characters', 'password');
    }

    if (password.length > 128) {
      throw new ValidationError('Password must be at most 128 characters', 'password');
    }

    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain a lowercase letter', 'password');
    }

    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain an uppercase letter', 'password');
    }

    if (!/[0-9]/.test(password)) {
      throw new ValidationError('Password must contain a number', 'password');
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      throw new ValidationError(
        'Password must contain a special character',
        'password'
      );
    }

    return new Password(password);
  }

  toString(): string {
    return this.value;
  }
}
