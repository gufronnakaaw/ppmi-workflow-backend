import { z } from 'zod';

export const createDivisionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreateDivisionInput = z.infer<typeof createDivisionSchema>;

export const updateDivisionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type UpdateDivisionInput = z.infer<typeof updateDivisionSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
