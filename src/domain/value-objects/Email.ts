import { ValidationError } from '../../domain/errors/index';

/**
 * Email value object with validation
 */
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    const normalized = email.trim().toLowerCase();

    if (!normalized) {
      throw new ValidationError('Email is required', 'email');
    }

    if (normalized.length > 254) {
      throw new ValidationError('Email is too long', 'email');
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(normalized)) {
      throw new ValidationError('Invalid email format', 'email');
    }

    return new Email(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
