import type { Architecture } from '../../domain/entities/Architecture.ts';
import type { ArchitectureType } from '../../shared/validation/schemas/architecture.schema.ts';

export interface ArchitectureDTO {
  id: string;
  userId: string;
  name: string;
  type: ArchitectureType;
  description: string;
  nodes: Architecture['nodes'];
  edges: Architecture['edges'];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchitectureListDTO {
  data: ArchitectureDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
