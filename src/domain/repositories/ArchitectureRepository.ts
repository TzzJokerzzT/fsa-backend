import type { Architecture } from '@/domain/entities/Architecture.ts';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Architecture repository interface (port)
 */
export interface ArchitectureRepository {
  findById(id: string): Promise<Architecture | null>;
  findByUserId(
    userId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<Architecture>>;
  save(architecture: Architecture): Promise<void>;
  delete(id: string): Promise<void>;
}
