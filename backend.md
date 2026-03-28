# Backend - Frontend Architecture Simulator

Especificacion tecnica del backend para el simulador de arquitecturas frontend.

## Stack Tecnologico

| Tecnologia | Uso |
|------------|-----|
| **Bun** | Runtime y gestor de paquetes |
| **TypeScript** | Lenguaje principal (strict mode) |
| **Hono** | Framework HTTP (ligero, edge-ready) |
| **MongoDB** | Base de datos (mongoose ODM) |
| **Valibot** | Validacion de esquemas |
| **jose** | JWT (access + refresh tokens) |
| **argon2** | Hash de passwords |

---

## Arquitectura Hexagonal

```
backend/
├── src/
│   ├── domain/                    # Capa de dominio (core)
│   │   ├── entities/
│   │   │   ├── User.ts
│   │   │   └── Architecture.ts
│   │   ├── value-objects/
│   │   │   ├── Email.ts
│   │   │   ├── Password.ts
│   │   │   └── UserId.ts
│   │   ├── repositories/          # Interfaces (ports)
│   │   │   ├── UserRepository.ts
│   │   │   └── ArchitectureRepository.ts
│   │   └── errors/
│   │       ├── DomainError.ts
│   │       └── index.ts
│   │
│   ├── application/               # Capa de aplicacion (use cases)
│   │   ├── use-cases/
│   │   │   ├── auth/
│   │   │   │   ├── RegisterUser.ts
│   │   │   │   ├── LoginUser.ts
│   │   │   │   ├── RefreshToken.ts
│   │   │   │   └── LogoutUser.ts
│   │   │   ├── user/
│   │   │   │   ├── UpdateUser.ts
│   │   │   │   ├── GetUserProfile.ts
│   │   │   │   └── DeleteUser.ts
│   │   │   └── architecture/
│   │   │       ├── CreateArchitecture.ts
│   │   │       ├── UpdateArchitecture.ts
│   │   │       ├── DeleteArchitecture.ts
│   │   │       ├── GetArchitecture.ts
│   │   │       └── ListUserArchitectures.ts
│   │   ├── services/
│   │   │   ├── TokenService.ts
│   │   │   └── PasswordService.ts
│   │   └── dtos/
│   │       ├── auth.dto.ts
│   │       ├── user.dto.ts
│   │       └── architecture.dto.ts
│   │
│   ├── infrastructure/            # Capa de infraestructura (adapters)
│   │   ├── persistence/
│   │   │   ├── mongodb/
│   │   │   │   ├── connection.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── UserModel.ts
│   │   │   │   │   └── ArchitectureModel.ts
│   │   │   │   └── repositories/
│   │   │   │       ├── MongoUserRepository.ts
│   │   │   │       └── MongoArchitectureRepository.ts
│   │   ├── http/
│   │   │   ├── server.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── user.routes.ts
│   │   │   │   └── architecture.routes.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── rateLimiter.middleware.ts
│   │   │   │   ├── security.middleware.ts
│   │   │   │   └── validation.middleware.ts
│   │   │   └── controllers/
│   │   │       ├── AuthController.ts
│   │   │       ├── UserController.ts
│   │   │       └── ArchitectureController.ts
│   │   └── security/
│   │       ├── jwt.ts
│   │       └── argon2.ts
│   │
│   ├── shared/                    # Utilidades compartidas
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── validation/
│   │   │   ├── schemas/
│   │   │   │   ├── auth.schema.ts
│   │   │   │   ├── user.schema.ts
│   │   │   │   └── architecture.schema.ts
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── result.ts          # Result pattern
│   │       └── id.ts
│   │
│   └── main.ts                    # Entry point
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── package.json
├── tsconfig.json
├── biome.json
└── .env.example
```

---

## Decision: Modelo de Datos

**Recomendacion: 2 colecciones separadas (Users + Architectures)**

### Justificacion

| Criterio | 1 Coleccion (embebido) | 2 Colecciones (referencia) |
|----------|------------------------|----------------------------|
| Limite documento MongoDB | 16MB max (problematico) | Sin limite practico |
| Consultas arquitecturas | Carga todo el usuario | Query independiente |
| Actualizaciones parciales | Complejo con arrays grandes | Simple y atomico |
| Compartir arquitecturas (futuro) | Requiere refactor | Ya preparado |
| Indices | Limitados en subdocs | Flexibles |

### Esquemas MongoDB

```typescript
// User Collection
{
  _id: ObjectId,
  email: string,           // unique, indexed
  passwordHash: string,
  name: string,
  avatar?: string,
  refreshTokenHash?: string,
  failedLoginAttempts: number,
  lockedUntil?: Date,
  createdAt: Date,
  updatedAt: Date
}

// Architecture Collection  
{
  _id: ObjectId,
  userId: ObjectId,        // indexed, ref: users
  name: string,
  type: ArchitectureType,
  description: string,
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
  isPublic: boolean,       // Para compartir (futuro)
  createdAt: Date,
  updatedAt: Date
}
```

---

## Validacion con Valibot

### Esquemas de Autenticacion

```typescript
// src/shared/validation/schemas/auth.schema.ts
import * as v from 'valibot';

// Email: RFC 5322 + restricciones de seguridad
export const EmailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.email('Email invalido'),
  v.maxLength(254, 'Email demasiado largo'),
  v.regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    'Formato de email invalido'
  )
);

// Password: OWASP guidelines
export const PasswordSchema = v.pipe(
  v.string(),
  v.minLength(12, 'Minimo 12 caracteres'),
  v.maxLength(128, 'Maximo 128 caracteres'),
  v.regex(/[a-z]/, 'Debe contener minuscula'),
  v.regex(/[A-Z]/, 'Debe contener mayuscula'),
  v.regex(/[0-9]/, 'Debe contener numero'),
  v.regex(/[^a-zA-Z0-9]/, 'Debe contener caracter especial')
);

// Name: Sanitizado
export const NameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(2, 'Minimo 2 caracteres'),
  v.maxLength(100, 'Maximo 100 caracteres'),
  v.regex(/^[\p{L}\p{M}\s'-]+$/u, 'Caracteres no permitidos')
);

// Register Request
export const RegisterSchema = v.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: NameSchema,
});

// Login Request
export const LoginSchema = v.object({
  email: EmailSchema,
  password: v.pipe(
    v.string(),
    v.minLength(1, 'Password requerido'),
    v.maxLength(128)
  ),
});

// Refresh Token Request
export const RefreshTokenSchema = v.object({
  refreshToken: v.pipe(
    v.string(),
    v.minLength(1, 'Refresh token requerido')
  ),
});

export type RegisterInput = v.InferOutput<typeof RegisterSchema>;
export type LoginInput = v.InferOutput<typeof LoginSchema>;
```

### Esquemas de Usuario

```typescript
// src/shared/validation/schemas/user.schema.ts
import * as v from 'valibot';
import { NameSchema, PasswordSchema } from './auth.schema';

export const UpdateUserSchema = v.object({
  name: v.optional(NameSchema),
  avatar: v.optional(
    v.pipe(
      v.string(),
      v.url('URL invalida'),
      v.maxLength(500)
    )
  ),
  currentPassword: v.optional(v.string()),
  newPassword: v.optional(PasswordSchema),
}, [
  // Validacion condicional: si hay newPassword, currentPassword es requerido
  v.custom((input) => {
    if (input.newPassword && !input.currentPassword) {
      return false;
    }
    return true;
  }, 'Se requiere password actual para cambiar password')
]);

export type UpdateUserInput = v.InferOutput<typeof UpdateUserSchema>;
```

### Esquemas de Arquitectura

```typescript
// src/shared/validation/schemas/architecture.schema.ts
import * as v from 'valibot';

// Tipos validos de arquitectura
const ArchitectureTypeSchema = v.picklist([
  'monolithic',
  'modular', 
  'feature-based',
  'atomic-design',
  'microfrontends',
  'clean-architecture',
  'hexagonal',
  'vertical-slice'
]);

// Tipos de nodo
const NodeTypeSchema = v.picklist([
  'component',
  'module',
  'state',
  'effect',
  'api',
  'hook',
  'context',
  'util'
]);

// Tipos de edge
const EdgeTypeSchema = v.picklist([
  'props',
  'state', 
  'event',
  'import',
  'context'
]);

// Position
const PositionSchema = v.object({
  x: v.number(),
  y: v.number()
});

// Node Prop
const NodePropSchema = v.object({
  name: v.pipe(v.string(), v.maxLength(100)),
  type: v.pipe(v.string(), v.maxLength(100)),
  required: v.boolean(),
  defaultValue: v.optional(v.pipe(v.string(), v.maxLength(500)))
});

// Node State
const NodeStateSchema = v.object({
  name: v.pipe(v.string(), v.maxLength(100)),
  type: v.pipe(v.string(), v.maxLength(100)),
  initialValue: v.optional(v.pipe(v.string(), v.maxLength(500)))
});

// Node Effect
const NodeEffectSchema = v.object({
  name: v.pipe(v.string(), v.maxLength(100)),
  dependencies: v.array(v.pipe(v.string(), v.maxLength(100))),
  cleanup: v.boolean()
});

// Node Data
const NodeDataSchema = v.object({
  label: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  type: NodeTypeSchema,
  description: v.optional(v.pipe(v.string(), v.maxLength(500))),
  props: v.optional(v.array(NodePropSchema, [v.maxLength(50)])),
  state: v.optional(v.array(NodeStateSchema, [v.maxLength(50)])),
  effects: v.optional(v.array(NodeEffectSchema, [v.maxLength(20)]))
});

// Architecture Node
const ArchitectureNodeSchema = v.object({
  id: v.pipe(v.string(), v.maxLength(50)),
  type: NodeTypeSchema,
  position: PositionSchema,
  data: NodeDataSchema,
  parentId: v.optional(v.pipe(v.string(), v.maxLength(50)))
});

// Edge Data
const EdgeDataSchema = v.object({
  type: EdgeTypeSchema,
  label: v.optional(v.pipe(v.string(), v.maxLength(100))),
  animated: v.optional(v.boolean())
});

// Architecture Edge
const ArchitectureEdgeSchema = v.object({
  id: v.pipe(v.string(), v.maxLength(50)),
  source: v.pipe(v.string(), v.maxLength(50)),
  target: v.pipe(v.string(), v.maxLength(50)),
  sourceHandle: v.optional(v.string()),
  targetHandle: v.optional(v.string()),
  data: EdgeDataSchema,
  animated: v.optional(v.boolean())
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
  nodes: v.array(ArchitectureNodeSchema, [
    v.maxLength(500, 'Maximo 500 nodos')
  ]),
  edges: v.array(ArchitectureEdgeSchema, [
    v.maxLength(1000, 'Maximo 1000 conexiones')
  ])
});

// Update Architecture (partial)
export const UpdateArchitectureSchema = v.partial(CreateArchitectureSchema);

// Pagination
export const PaginationSchema = v.object({
  page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 20)
});

// MongoDB ObjectId validation
export const ObjectIdSchema = v.pipe(
  v.string(),
  v.regex(/^[a-f\d]{24}$/i, 'ID invalido')
);

export type CreateArchitectureInput = v.InferOutput<typeof CreateArchitectureSchema>;
export type UpdateArchitectureInput = v.InferOutput<typeof UpdateArchitectureSchema>;
```

---

## Seguridad

### 1. Autenticacion JWT (Access + Refresh Tokens)

```typescript
// src/infrastructure/security/jwt.ts
import * as jose from 'jose';
import type { Env } from '@/shared/config/env';

export interface TokenPayload {
  sub: string;  // userId
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export class JwtService {
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;
  
  constructor(env: Env) {
    this.accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
    this.refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  }

  async generateAccessToken(userId: string): Promise<string> {
    return new jose.SignJWT({ sub: userId, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')  // 15 minutos
      .sign(this.accessSecret);
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return new jose.SignJWT({ sub: userId, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')  // 7 dias
      .sign(this.refreshSecret);
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jose.jwtVerify(token, this.accessSecret);
      if (payload.type !== 'access') return null;
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jose.jwtVerify(token, this.refreshSecret);
      if (payload.type !== 'refresh') return null;
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }
}
```

### 2. Hash de Passwords con Argon2

```typescript
// src/infrastructure/security/argon2.ts
import { hash, verify } from 'argon2';

// OWASP recommended settings para Argon2id
const ARGON2_OPTIONS = {
  type: 2,           // argon2id
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iteraciones
  parallelism: 4,    // 4 threads
};

export class PasswordService {
  async hash(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await verify(hash, password);
    } catch {
      return false;
    }
  }
}
```

### 3. Rate Limiting

```typescript
// src/infrastructure/http/middlewares/rateLimiter.middleware.ts
import type { MiddlewareHandler } from 'hono';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

// In-memory store (usar Redis en produccion)
const store = new Map<string, RateLimitStore>();

interface RateLimitConfig {
  windowMs: number;      // Ventana de tiempo
  maxRequests: number;   // Max requests por ventana
  keyGenerator?: (c: Context) => string;
}

export function rateLimiter(config: RateLimitConfig): MiddlewareHandler {
  const { windowMs, maxRequests, keyGenerator } = config;

  return async (c, next) => {
    const key = keyGenerator?.(c) ?? getClientIP(c);
    const now = Date.now();
    
    let record = store.get(key);
    
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      store.set(key, record);
    }
    
    record.count++;
    
    // Headers informativos
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));
    
    if (record.count > maxRequests) {
      c.header('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
      return c.json({ error: 'Too many requests' }, 429);
    }
    
    await next();
  };
}

// Rate limits por endpoint
export const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  maxRequests: 5,             // 5 intentos de login
});

export const apiRateLimit = rateLimiter({
  windowMs: 60 * 1000,       // 1 minuto
  maxRequests: 100,          // 100 requests
});

export const strictRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hora
  maxRequests: 3,            // 3 intentos (password reset, etc.)
});
```

### 4. Security Headers Middleware

```typescript
// src/infrastructure/http/middlewares/security.middleware.ts
import type { MiddlewareHandler } from 'hono';
import { secureHeaders } from 'hono/secure-headers';

export const securityHeaders: MiddlewareHandler = secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  xXssProtection: '1; mode=block',
});

// Sanitizacion de input
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    // Eliminar caracteres de control excepto whitespace comun
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [k, sanitizeInput(v)])
    );
  }
  return input;
}
```

### 5. Proteccion Contra Ataques Comunes

```typescript
// src/infrastructure/http/middlewares/protection.middleware.ts
import type { MiddlewareHandler } from 'hono';

// Proteccion contra Mass Assignment
export function allowedFields<T extends object>(
  allowed: (keyof T)[]
): (body: Record<string, unknown>) => Partial<T> {
  const allowedSet = new Set(allowed as string[]);
  return (body) => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedSet.has(key)) {
        result[key] = value;
      }
    }
    return result as Partial<T>;
  };
}

// Proteccion contra Timing Attacks en comparacion de tokens
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Comparar contra si mismo para mantener tiempo constante
    b = a;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0 && a.length === b.length;
}

// Account Lockout despues de intentos fallidos
export interface LockoutConfig {
  maxAttempts: number;
  lockoutDuration: number; // ms
}

export class AccountLockout {
  constructor(private config: LockoutConfig) {}

  shouldLock(failedAttempts: number): boolean {
    return failedAttempts >= this.config.maxAttempts;
  }

  getLockoutUntil(): Date {
    return new Date(Date.now() + this.config.lockoutDuration);
  }

  isLocked(lockedUntil: Date | null): boolean {
    if (!lockedUntil) return false;
    return new Date() < lockedUntil;
  }
}
```

### 6. Middleware de Autenticacion

```typescript
// src/infrastructure/http/middlewares/auth.middleware.ts
import type { MiddlewareHandler, Context } from 'hono';
import { JwtService } from '@/infrastructure/security/jwt';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
  }
}

export function authMiddleware(jwtService: JwtService): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'No autorizado' }, 401);
    }
    
    const token = authHeader.slice(7);
    const payload = await jwtService.verifyAccessToken(token);
    
    if (!payload) {
      return c.json({ error: 'Token invalido o expirado' }, 401);
    }
    
    c.set('userId', payload.sub);
    await next();
  };
}

// Middleware para verificar ownership de recursos
export function ownershipMiddleware(
  getResourceOwnerId: (c: Context) => Promise<string | null>
): MiddlewareHandler {
  return async (c, next) => {
    const userId = c.get('userId');
    const ownerId = await getResourceOwnerId(c);
    
    if (!ownerId) {
      return c.json({ error: 'Recurso no encontrado' }, 404);
    }
    
    if (ownerId !== userId) {
      return c.json({ error: 'No autorizado' }, 403);
    }
    
    await next();
  };
}
```

### 7. Middleware de Validacion

```typescript
// src/infrastructure/http/middlewares/validation.middleware.ts
import type { MiddlewareHandler } from 'hono';
import * as v from 'valibot';
import { sanitizeInput } from './security.middleware';

type ValidationTarget = 'json' | 'query' | 'param';

export function validate<T extends v.BaseSchema>(
  schema: T,
  target: ValidationTarget = 'json'
): MiddlewareHandler {
  return async (c, next) => {
    let data: unknown;
    
    try {
      switch (target) {
        case 'json':
          data = await c.req.json();
          break;
        case 'query':
          data = c.req.query();
          break;
        case 'param':
          data = c.req.param();
          break;
      }
    } catch {
      return c.json({ error: 'Cuerpo de request invalido' }, 400);
    }
    
    // Sanitizar input
    data = sanitizeInput(data);
    
    // Validar con Valibot
    const result = v.safeParse(schema, data);
    
    if (!result.success) {
      const errors = result.issues.map(issue => ({
        path: issue.path?.map(p => p.key).join('.') || 'root',
        message: issue.message
      }));
      
      return c.json({ 
        error: 'Validacion fallida',
        details: errors 
      }, 400);
    }
    
    // Guardar datos validados en context
    c.set('validatedData', result.output);
    await next();
  };
}
```

---

## API Endpoints

### Autenticacion

| Metodo | Endpoint | Descripcion | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/register` | Registrar usuario | 5/15min |
| POST | `/api/auth/login` | Iniciar sesion | 5/15min |
| POST | `/api/auth/refresh` | Renovar tokens | 10/min |
| POST | `/api/auth/logout` | Cerrar sesion | 10/min |

### Usuario

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Obtener perfil | Required |
| PATCH | `/api/users/me` | Actualizar perfil | Required |
| DELETE | `/api/users/me` | Eliminar cuenta | Required |

### Arquitecturas

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| GET | `/api/architectures` | Listar arquitecturas | Required |
| POST | `/api/architectures` | Crear arquitectura | Required |
| GET | `/api/architectures/:id` | Obtener arquitectura | Required |
| PUT | `/api/architectures/:id` | Actualizar arquitectura | Required |
| DELETE | `/api/architectures/:id` | Eliminar arquitectura | Required |

---

## Implementacion de Use Cases

### Register User

```typescript
// src/application/use-cases/auth/RegisterUser.ts
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { PasswordService } from '@/application/services/PasswordService';
import type { RegisterInput } from '@/shared/validation/schemas/auth.schema';
import { Result, ok, err } from '@/shared/utils/result';
import { User } from '@/domain/entities/User';

export class RegisterUser {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService
  ) {}

  async execute(input: RegisterInput): Promise<Result<User, string>> {
    // Verificar si email ya existe
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      return err('El email ya esta registrado');
    }

    // Hash del password
    const passwordHash = await this.passwordService.hash(input.password);

    // Crear usuario
    const user = User.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    // Persistir
    await this.userRepository.save(user);

    return ok(user);
  }
}
```

### Login User

```typescript
// src/application/use-cases/auth/LoginUser.ts
import type { UserRepository } from '@/domain/repositories/UserRepository';
import type { PasswordService } from '@/application/services/PasswordService';
import type { JwtService } from '@/infrastructure/security/jwt';
import type { LoginInput } from '@/shared/validation/schemas/auth.schema';
import { Result, ok, err } from '@/shared/utils/result';
import { AccountLockout } from '@/infrastructure/http/middlewares/protection.middleware';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string };
}

export class LoginUser {
  private lockout = new AccountLockout({
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutos
  });

  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private jwtService: JwtService
  ) {}

  async execute(input: LoginInput): Promise<Result<LoginResult, string>> {
    const user = await this.userRepository.findByEmail(input.email);
    
    // Respuesta generica para evitar enumeracion de usuarios
    const genericError = 'Credenciales invalidas';

    if (!user) {
      // Ejecutar hash dummy para evitar timing attack
      await this.passwordService.hash(input.password);
      return err(genericError);
    }

    // Verificar lockout
    if (this.lockout.isLocked(user.lockedUntil)) {
      return err('Cuenta bloqueada temporalmente. Intente mas tarde.');
    }

    // Verificar password
    const isValid = await this.passwordService.verify(
      user.passwordHash,
      input.password
    );

    if (!isValid) {
      // Incrementar intentos fallidos
      user.failedLoginAttempts++;
      
      if (this.lockout.shouldLock(user.failedLoginAttempts)) {
        user.lockedUntil = this.lockout.getLockoutUntil();
      }
      
      await this.userRepository.save(user);
      return err(genericError);
    }

    // Login exitoso: resetear intentos
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    // Generar tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.generateAccessToken(user.id),
      this.jwtService.generateRefreshToken(user.id),
    ]);

    // Guardar hash del refresh token
    user.refreshTokenHash = await this.passwordService.hash(refreshToken);
    await this.userRepository.save(user);

    return ok({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  }
}
```

---

## Configuracion de Entorno

```typescript
// src/shared/config/env.ts
import * as v from 'valibot';

const EnvSchema = v.object({
  // Server
  PORT: v.pipe(v.string(), v.transform(Number), v.number()),
  NODE_ENV: v.picklist(['development', 'production', 'test']),
  
  // Database
  MONGODB_URI: v.pipe(v.string(), v.url()),
  
  // JWT Secrets (minimo 32 caracteres)
  JWT_ACCESS_SECRET: v.pipe(v.string(), v.minLength(32)),
  JWT_REFRESH_SECRET: v.pipe(v.string(), v.minLength(32)),
  
  // CORS
  CORS_ORIGIN: v.string(),
});

export type Env = v.InferOutput<typeof EnvSchema>;

export function loadEnv(): Env {
  const result = v.safeParse(EnvSchema, {
    PORT: process.env.PORT ?? '3000',
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  });

  if (!result.success) {
    console.error('Environment validation failed:');
    for (const issue of result.issues) {
      console.error(`  - ${issue.path?.map(p => p.key).join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.output;
}
```

### .env.example

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/fas

# JWT Secrets (generar con: openssl rand -base64 48)
JWT_ACCESS_SECRET=your-access-secret-min-32-chars-here-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars-here-change-in-production

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## Server Setup

```typescript
// src/main.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { loadEnv } from '@/shared/config/env';
import { connectDatabase } from '@/infrastructure/persistence/mongodb/connection';
import { securityHeaders } from '@/infrastructure/http/middlewares/security.middleware';
import { apiRateLimit } from '@/infrastructure/http/middlewares/rateLimiter.middleware';
import { authRoutes } from '@/infrastructure/http/routes/auth.routes';
import { userRoutes } from '@/infrastructure/http/routes/user.routes';
import { architectureRoutes } from '@/infrastructure/http/routes/architecture.routes';

const env = loadEnv();

const app = new Hono();

// Global middlewares
app.use('*', logger());
app.use('*', securityHeaders);
app.use('*', cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));
app.use('/api/*', apiRateLimit);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/architectures', architectureRoutes);

// Error handler global
app.onError((err, c) => {
  console.error(err);
  
  if (env.NODE_ENV === 'production') {
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
  
  return c.json({ error: err.message }, 500);
});

// 404 handler
app.notFound((c) => c.json({ error: 'Endpoint no encontrado' }, 404));

// Start server
async function main() {
  await connectDatabase(env.MONGODB_URI);
  
  console.log(`Server running on port ${env.PORT}`);
  
  Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
  });
}

main().catch(console.error);
```

---

## Dependencias (package.json del backend)

```json
{
  "name": "fas-backend",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/main.ts",
    "build": "bun build src/main.ts --outdir dist --target bun",
    "start": "bun run dist/main.js",
    "test": "bun test",
    "lint": "biome check src",
    "format": "biome format --write src"
  },
  "dependencies": {
    "hono": "^4.6.0",
    "mongoose": "^8.8.0",
    "jose": "^5.9.0",
    "argon2": "^0.41.0",
    "valibot": "^0.42.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.3.0",
    "@types/bun": "latest",
    "typescript": "^5.6.0"
  }
}
```

---

## Checklist de Seguridad

- [x] Passwords hasheados con Argon2id (OWASP settings)
- [x] JWT con access token corto (15min) + refresh token (7d)
- [x] Rate limiting por IP y endpoint
- [x] Account lockout despues de 5 intentos fallidos
- [x] Respuestas genericas para evitar enumeracion de usuarios
- [x] Proteccion contra timing attacks
- [x] Security headers (CSP, HSTS, X-Frame-Options, etc.)
- [x] Validacion estricta de input con Valibot
- [x] Sanitizacion de caracteres de control
- [x] Proteccion contra mass assignment
- [x] CORS configurado restrictivamente
- [x] Variables de entorno validadas al inicio
- [x] Secrets con minimo 32 caracteres
- [x] Refresh token hasheado en DB (no en texto plano)
- [x] Ownership verification en recursos
