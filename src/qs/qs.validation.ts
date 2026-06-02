import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createQsSchema = z.object({
  division_id: z.uuid(),
  type: z.enum(['NEW', 'RENEWAL']),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']),
  insured: z.string().min(1),
  vessel: z.string().min(1),
  insurance: z.string().min(1),
  member: z.string().min(1),
  leader: z.string().min(1),
  policy_number: z.string().min(1),
  period_from: z.string().min(1),
  period_to: z.string().min(1),
  premium_amount: z.number().int(),
  currency: z.string().min(1),
  remarks: z.string().min(1),
});

export class CreateQsDto extends createZodDto(createQsSchema) {}

export const updateQsSchema = z.object({
  division_id: z.uuid().optional(),
  type: z.enum(['NEW', 'RENEWAL']).optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
  insured: z.string().min(1).optional(),
  vessel: z.string().min(1).optional(),
  insurance: z.string().min(1).optional(),
  member: z.string().min(1).optional(),
  leader: z.string().min(1).optional(),
  policy_number: z.string().min(1).optional(),
  period_from: z.string().min(1).optional(),
  period_to: z.string().min(1).optional(),
  premium_amount: z.number().int().optional(),
  currency: z.string().min(1).optional(),
  remarks: z.string().min(1).optional(),
});

export class UpdateQsDto extends createZodDto(updateQsSchema) {}
