import { User } from '../../../../domain/entities/User';
import type { UserRepository } from '../../../../domain/repositories/UserRepository';
import { UserModel } from '../models/UserModel';

export class MongoUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async save(user: User): Promise<void> {
    const data = user.toPersistence();
    await UserModel.findByIdAndUpdate(
      data.id,
      {
        $set: {
          email: data.email,
          passwordHash: data.passwordHash,
          name: data.name,
          avatar: data.avatar,
          refreshTokenHash: data.refreshTokenHash,
          failedLoginAttempts: data.failedLoginAttempts,
          lockedUntil: data.lockedUntil,
          updatedAt: data.updatedAt,
        },
        $setOnInsert: {
          createdAt: data.createdAt,
        },
      },
      { upsert: true, new: true }
    );
  }

  async delete(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(doc: any): User {
    return User.fromPersistence({
      id: doc._id.toHexString(),
      email: doc.email,
      passwordHash: doc.passwordHash,
      name: doc.name,
      avatar: doc.avatar,
      refreshTokenHash: doc.refreshTokenHash,
      failedLoginAttempts: doc.failedLoginAttempts,
      lockedUntil: doc.lockedUntil ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
