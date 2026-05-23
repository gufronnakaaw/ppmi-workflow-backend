import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export class LoginDto extends createZodDto(loginSchema) {}

export const registerSchema = z.object({
  fullname: z.string().min(2),
  email: z.email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  is_admin: z.boolean().optional(),
  division_id: z.uuid().optional(),
  roles: z.array(z.uuid()).optional(),
});

export class RegisterDto extends createZodDto(registerSchema) {}
