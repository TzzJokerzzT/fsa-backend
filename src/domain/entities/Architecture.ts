import { generateId } from '../../shared/utils/id';
import type {
  ArchitectureType,
  NodeType,
  EdgeType,
} from '../../shared/validation/schemas/architecture.schema';

export interface Position {
  x: number;
  y: number;
}

export interface NodeProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export interface NodeState {
  name: string;
  type: string;
  initialValue?: string;
}

export interface NodeEffect {
  name: string;
  dependencies: string[];
  cleanup: boolean;
}

export interface NodeData {
  label: string;
  type: NodeType;
  description?: string;
  props?: NodeProp[];
  state?: NodeState[];
  effects?: NodeEffect[];
}

export interface ArchitectureNode {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
  parentId?: string;
}

export interface EdgeData {
  type: EdgeType;
  label?: string;
  animated?: boolean;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data: EdgeData;
  animated?: boolean;
}

export interface ArchitectureProps {
  id: string;
  userId: string;
  name: string;
  type: ArchitectureType;
  description: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateArchitectureProps {
  userId: string;
  name: string;
  type: ArchitectureType;
  description: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

/**
 * Architecture domain entity
 */
export class Architecture {
  private constructor(private props: ArchitectureProps) {}

  static create(input: CreateArchitectureProps): Architecture {
    const now = new Date();
    return new Architecture({
      id: generateId(),
      userId: input.userId,
      name: input.name,
      type: input.type,
      description: input.description,
      nodes: input.nodes,
      edges: input.edges,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ArchitectureProps): Architecture {
    return new Architecture(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): ArchitectureType {
    return this.props.type;
  }

  get description(): string {
    return this.props.description;
  }

  get nodes(): ArchitectureNode[] {
    return this.props.nodes;
  }

  get edges(): ArchitectureEdge[] {
    return this.props.edges;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Update methods
  updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updateType(type: ArchitectureType): void {
    this.props.type = type;
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateNodes(nodes: ArchitectureNode[]): void {
    this.props.nodes = nodes;
    this.props.updatedAt = new Date();
  }

  updateEdges(edges: ArchitectureEdge[]): void {
    this.props.edges = edges;
    this.props.updatedAt = new Date();
  }

  setPublic(isPublic: boolean): void {
    this.props.isPublic = isPublic;
    this.props.updatedAt = new Date();
  }

  isOwnedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  toPersistence(): ArchitectureProps {
    return { ...this.props };
  }

  toJSON(): ArchitectureProps {
    return { ...this.props };
  }
}
