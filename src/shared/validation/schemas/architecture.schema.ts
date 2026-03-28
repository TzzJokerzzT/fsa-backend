import * as v from 'valibot';

// Tipos validos de arquitectura
export const ArchitectureTypeSchema = v.picklist([
  'monolithic',
  'modular',
  'feature-based',
  'atomic-design',
  'microfrontends',
  'clean-architecture',
  'hexagonal',
  'vertical-slice',
]);

// Tipos de nodo
export const NodeTypeSchema = v.picklist([
  'component',
  'module',
  'state',
  'effect',
  'api',
  'hook',
  'context',
  'util',
]);

// Tipos de edge
export const EdgeTypeSchema = v.picklist([
  'props',
  'state',
  'event',
  'import',
  'context',
]);

// Position
const PositionSchema = v.object({
  x: v.number(),
  y: v.number(),
});

// Node Prop
const NodePropSchema = v.object({
  name: v.pipe(v.string(), v.maxLength(100)),
  type: v.pipe(v.string(), v.maxLength(100)),
  required: v.boolean(),
  defaultValue: v.optional(v.pipe(v.string(), v.maxLength(500))),
});

// Node State
const NodeStateSchema = v.object({
  name: v.pipe(v.string(), v.maxLength(100)),
  type: v.pipe(v.string(), v.maxLength(100)),
  initialValue: v.optional(v.pipe(v.string(), v.maxLength(500))),
});

// Node Effect
const NodeEffectSchema = v.object({
  name: v.pipe(v.string(), v.maxLength(100)),
  dependencies: v.pipe(
    v.array(v.pipe(v.string(), v.maxLength(100))),
    v.maxLength(50)
  ),
  cleanup: v.boolean(),
});

// Node Data
const NodeDataSchema = v.object({
  label: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  type: NodeTypeSchema,
  description: v.optional(v.pipe(v.string(), v.maxLength(500))),
  props: v.optional(v.pipe(v.array(NodePropSchema), v.maxLength(50))),
  state: v.optional(v.pipe(v.array(NodeStateSchema), v.maxLength(50))),
  effects: v.optional(v.pipe(v.array(NodeEffectSchema), v.maxLength(20))),
});

// Architecture Node
const ArchitectureNodeSchema = v.object({
  id: v.pipe(v.string(), v.maxLength(50)),
  type: NodeTypeSchema,
  position: PositionSchema,
  data: NodeDataSchema,
  parentId: v.optional(v.pipe(v.string(), v.maxLength(50))),
});

// Edge Data
const EdgeDataSchema = v.object({
  type: EdgeTypeSchema,
  label: v.optional(v.pipe(v.string(), v.maxLength(100))),
  animated: v.optional(v.boolean()),
});

// Architecture Edge
const ArchitectureEdgeSchema = v.object({
  id: v.pipe(v.string(), v.maxLength(50)),
  source: v.pipe(v.string(), v.maxLength(50)),
  target: v.pipe(v.string(), v.maxLength(50)),
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
  data: EdgeDataSchema,
  animated: v.optional(v.boolean()),
});

// Create Architecture
export const CreateArchitectureSchema = v.object({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Nombre requerido'),
    v.maxLength(100, 'Nombre muy largo')
  ),
  type: ArchitectureTypeSchema,
  description: v.pipe(
    v.string(),
    v.trim(),
    v.maxLength(500, 'Descripcion muy larga')
  ),
  nodes: v.pipe(
    v.array(ArchitectureNodeSchema),
    v.maxLength(500, 'Maximo 500 nodos')
  ),
  edges: v.pipe(
    v.array(ArchitectureEdgeSchema),
    v.maxLength(1000, 'Maximo 1000 conexiones')
  ),
});

// Update Architecture (partial)
export const UpdateArchitectureSchema = v.partial(CreateArchitectureSchema);

// Pagination
export const PaginationSchema = v.object({
  page: v.optional(
    v.pipe(v.unknown(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
    1
  ),
  limit: v.optional(
    v.pipe(
      v.unknown(),
      v.transform(Number),
      v.number(),
      v.integer(),
      v.minValue(1),
      v.maxValue(100)
    ),
    20
  ),
});

// MongoDB ObjectId validation
export const ObjectIdSchema = v.pipe(
  v.string(),
  v.regex(/^[a-f\d]{24}$/i, 'ID invalido')
);

export type ArchitectureType = v.InferOutput<typeof ArchitectureTypeSchema>;
export type NodeType = v.InferOutput<typeof NodeTypeSchema>;
export type EdgeType = v.InferOutput<typeof EdgeTypeSchema>;
export type CreateArchitectureInput = v.InferOutput<typeof CreateArchitectureSchema>;
export type UpdateArchitectureInput = v.InferOutput<typeof UpdateArchitectureSchema>;
export type PaginationInput = v.InferOutput<typeof PaginationSchema>;
