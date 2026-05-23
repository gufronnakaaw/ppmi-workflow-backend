import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createDivisionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export class CreateDivisionDto extends createZodDto(createDivisionSchema) {}

export const updateDivisionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export class UpdateDivisionDto extends createZodDto(updateDivisionSchema) {}

export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export class CreateRoleDto extends createZodDto(createRoleSchema) {}

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export class UpdateRoleDto extends createZodDto(updateRoleSchema) {}
