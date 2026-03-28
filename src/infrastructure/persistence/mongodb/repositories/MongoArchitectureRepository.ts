import { Architecture } from '@/domain/entities/Architecture.ts';
import type {
  ArchitectureRepository,
  PaginationOptions,
  PaginatedResult,
} from '@/domain/repositories/ArchitectureRepository.ts';
import { ArchitectureModel } from '../models/ArchitectureModel.ts';

export class MongoArchitectureRepository implements ArchitectureRepository {
  async findById(id: string): Promise<Architecture | null> {
    const doc = await ArchitectureModel.findById(id).lean().exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByUserId(
    userId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Architecture>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      ArchitectureModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ArchitectureModel.countDocuments({ userId }),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(architecture: Architecture): Promise<void> {
    const data = architecture.toPersistence();
    await ArchitectureModel.findByIdAndUpdate(
      data.id,
      {
        $set: {
          userId: data.userId,
          name: data.name,
          type: data.type,
          description: data.description,
          nodes: data.nodes,
          edges: data.edges,
          isPublic: data.isPublic,
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
    await ArchitectureModel.findByIdAndDelete(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(doc: any): Architecture {
    return Architecture.fromPersistence({
      id: doc._id.toHexString(),
      userId: doc.userId.toHexString(),
      name: doc.name,
      type: doc.type,
      description: doc.description,
      nodes: doc.nodes,
      edges: doc.edges,
      isPublic: doc.isPublic,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
