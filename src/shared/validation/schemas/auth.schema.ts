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
  refreshToken: v.pipe(v.string(), v.minLength(1, 'Refresh token requerido')),
});

export type RegisterInput = v.InferOutput<typeof RegisterSchema>;
export type LoginInput = v.InferOutput<typeof LoginSchema>;
export type RefreshTokenInput = v.InferOutput<typeof RefreshTokenSchema>;
