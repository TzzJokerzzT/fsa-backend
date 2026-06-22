import * as v from 'valibot';
import { NameSchema, PasswordSchema } from './auth.schema';

export const UpdateUserSchema = v.pipe(
  v.object({
    name: v.optional(NameSchema),
    avatar: v.optional(
      v.pipe(v.string(), v.url('URL invalida'), v.maxLength(500))
    ),
    currentPassword: v.optional(v.string()),
    newPassword: v.optional(PasswordSchema),
  }),
  v.check((input) => {
    // Validacion condicional: si hay newPassword, currentPassword es requerido
    if (input.newPassword && !input.currentPassword) {
      return false;
    }
    return true;
  }, 'Se requiere password actual para cambiar password')
);

export type UpdateUserInput = v.InferOutput<typeof UpdateUserSchema>;
