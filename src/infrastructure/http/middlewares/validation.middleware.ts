import type { MiddlewareHandler, Context } from 'hono';
import * as v from 'valibot';
import { sanitizeInput } from './security.middleware.ts';

type ValidationTarget = 'json' | 'query' | 'param';

declare module 'hono' {
  interface ContextVariableMap {
    validatedData: unknown;
  }
}

export function validate<T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
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
      const errors = result.issues.map((issue) => ({
        path: issue.path?.map((p) => p.key).join('.') || 'root',
        message: issue.message,
      }));

      return c.json(
        {
          error: 'Validacion fallida',
          details: errors,
        },
        400
      );
    }

    // Guardar datos validados en context
    c.set('validatedData', result.output);
    await next();
  };
}

export function getValidatedData<T>(c: Context): T {
  return c.get('validatedData') as T;
}
