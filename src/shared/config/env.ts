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
    const messages = result.issues.map(
      (issue) =>
        `${issue.path?.map((p) => p.key).join('.') ?? 'unknown'}: ${issue.message}`,
    );
    const detail = messages.join('; ');
    console.error(`Environment validation failed: ${detail}`);
    throw new Error(`Missing or invalid environment variables: ${detail}`);
  }

  return result.output;
}
