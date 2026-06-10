import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createPaymentSchema = z.object({
  voucher_id: z.string().min(1),
  installment_number: z.number().int(),
  payment_date: z.string().min(1),
  due_date: z.string().min(1),
  paid_amount: z.number().int(),
  remaining_amount: z.number().int(),
  payment_status: z.enum(['UNPAID', 'INSTALLMENT', 'PAID']),
  payment_proof: z.string().min(1).optional(),
  remarks: z.string().min(1),
});

export class CreatePaymentDto extends createZodDto(createPaymentSchema) {}

export const updatePaymentSchema = z.object({
  voucher_id: z.string().min(1).optional(),
  installment_number: z.number().int().optional(),
  payment_date: z.string().min(1).optional(),
  due_date: z.string().min(1).optional(),
  paid_amount: z.number().int().optional(),
  remaining_amount: z.number().int().optional(),
  payment_status: z.enum(['UNPAID', 'INSTALLMENT', 'PAID']).optional(),
  payment_proof: z.string().min(1).optional(),
  remarks: z.string().min(1).optional(),
});

export class UpdatePaymentDto extends createZodDto(updatePaymentSchema) {}
