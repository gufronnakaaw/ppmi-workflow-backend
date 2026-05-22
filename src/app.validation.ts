import { z } from 'zod';

export const createDivisionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreateDivisionInput = z.infer<typeof createDivisionSchema>;

export const updateDivisionSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export type UpdateDivisionInput = z.infer<typeof updateDivisionSchema>;
