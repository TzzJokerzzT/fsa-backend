import mongoose, { Schema, type Document } from 'mongoose';
import type {
  ArchitectureNode,
  ArchitectureEdge,
} from '@/domain/entities/Architecture.ts';
import type { ArchitectureType } from '@/shared/validation/schemas/architecture.schema.ts';

export interface IArchitecture extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  type: ArchitectureType;
  description: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PositionSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const NodePropSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    required: { type: Boolean, required: true },
    defaultValue: { type: String },
  },
  { _id: false }
);

const NodeStateSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    initialValue: { type: String },
  },
  { _id: false }
);

const NodeEffectSchema = new Schema(
  {
    name: { type: String, required: true },
    dependencies: [{ type: String }],
    cleanup: { type: Boolean, required: true },
  },
  { _id: false }
);

const NodeDataSchema = new Schema(
  {
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['component', 'module', 'state', 'effect', 'api', 'hook', 'context', 'util'],
    },
    description: { type: String },
    props: [NodePropSchema],
    state: [NodeStateSchema],
    effects: [NodeEffectSchema],
  },
  { _id: false }
);

const ArchitectureNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['component', 'module', 'state', 'effect', 'api', 'hook', 'context', 'util'],
    },
    position: { type: PositionSchema, required: true },
    data: { type: NodeDataSchema, required: true },
    parentId: { type: String },
  },
  { _id: false }
);

const EdgeDataSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['props', 'state', 'event', 'import', 'context'],
    },
    label: { type: String },
    animated: { type: Boolean },
  },
  { _id: false }
);

const ArchitectureEdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String },
    targetHandle: { type: String },
    data: { type: EdgeDataSchema, required: true },
    animated: { type: Boolean },
  },
  { _id: false }
);

const ArchitectureSchema = new Schema<IArchitecture>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'monolithic',
        'modular',
        'feature-based',
        'atomic-design',
        'microfrontends',
        'clean-architecture',
        'hexagonal',
        'vertical-slice',
      ],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    nodes: [ArchitectureNodeSchema],
    edges: [ArchitectureEdgeSchema],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for user's architectures
ArchitectureSchema.index({ userId: 1, createdAt: -1 });

export const ArchitectureModel = mongoose.model<IArchitecture>(
  'Architecture',
  ArchitectureSchema
);
