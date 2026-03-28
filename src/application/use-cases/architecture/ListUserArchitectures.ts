import type { ArchitectureRepository } from '@/domain/repositories/ArchitectureRepository.ts';
import type { PaginationInput } from '@/shared/validation/schemas/architecture.schema.ts';
import type { ArchitectureListDTO } from '@/application/dtos/architecture.dto.ts';
import { type Result, ok } from '@/shared/utils/result.ts';

export class ListUserArchitectures {
  constructor(private architectureRepository: ArchitectureRepository) {}

  async execute(
    userId: string,
    pagination: PaginationInput
  ): Promise<Result<ArchitectureListDTO, string>> {
    const result = await this.architectureRepository.findByUserId(userId, {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
    });

    return ok({
      data: result.data.map((arch) => arch.toJSON()),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }
}
