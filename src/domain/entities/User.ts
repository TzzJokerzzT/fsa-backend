import { generateId } from '@/shared/utils/id.ts';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  refreshTokenHash?: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: string;
  passwordHash: string;
  name: string;
}

/**
 * User domain entity
 */
export class User {
  private constructor(private props: UserProps) {}

  static create(input: CreateUserProps): User {
    const now = new Date();
    return new User({
      id: generateId(),
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name,
      avatar: undefined,
      refreshTokenHash: undefined,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get name(): string {
    return this.props.name;
  }

  get avatar(): string | undefined {
    return this.props.avatar;
  }

  get refreshTokenHash(): string | undefined {
    return this.props.refreshTokenHash;
  }

  get failedLoginAttempts(): number {
    return this.props.failedLoginAttempts;
  }

  get lockedUntil(): Date | null {
    return this.props.lockedUntil;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Setters with mutation tracking
  set name(value: string) {
    this.props.name = value;
    this.props.updatedAt = new Date();
  }

  set avatar(value: string | undefined) {
    this.props.avatar = value;
    this.props.updatedAt = new Date();
  }

  set passwordHash(value: string) {
    this.props.passwordHash = value;
    this.props.updatedAt = new Date();
  }

  set refreshTokenHash(value: string | undefined) {
    this.props.refreshTokenHash = value;
    this.props.updatedAt = new Date();
  }

  set failedLoginAttempts(value: number) {
    this.props.failedLoginAttempts = value;
    this.props.updatedAt = new Date();
  }

  set lockedUntil(value: Date | null) {
    this.props.lockedUntil = value;
    this.props.updatedAt = new Date();
  }

  isLocked(): boolean {
    if (!this.props.lockedUntil) return false;
    return new Date() < this.props.lockedUntil;
  }

  resetLoginAttempts(): void {
    this.props.failedLoginAttempts = 0;
    this.props.lockedUntil = null;
    this.props.updatedAt = new Date();
  }

  incrementFailedAttempts(): void {
    this.props.failedLoginAttempts++;
    this.props.updatedAt = new Date();
  }

  toPersistence(): UserProps {
    return { ...this.props };
  }

  toJSON(): Omit<UserProps, 'passwordHash' | 'refreshTokenHash'> {
    const { passwordHash: _, refreshTokenHash: __, ...rest } = this.props;
    return rest;
  }
}
