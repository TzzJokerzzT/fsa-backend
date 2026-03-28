import { ValidationError } from '@/domain/errors/index.ts';
import { isValidObjectId } from '@/shared/utils/id.ts';

/**
 * UserId value object
 */
export class UserId {
  private constructor(private readonly value: string) {}

  static create(id: string): UserId {
    if (!isValidObjectId(id)) {
      throw new ValidationError('Invalid user ID format', 'userId');
    }
    return new UserId(id);
  }

  static fromString(id: string): UserId {
    return new UserId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
