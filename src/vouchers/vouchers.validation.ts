import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createVoucherSchema = z.object({
  invoice_id: z.string().min(1),
  voucher_number: z.string().min(1),
  voucher_date: z.string().min(1),
  payment_type: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE']),
  bank_id: z.string().min(1).optional(),
  amount: z.number().int(),
  currency: z.string().min(1),
  status: z.enum(['DRAFT', 'PENDING', 'CLOSED']),
  remarks: z.string().min(1),
});

export class CreateVoucherDto extends createZodDto(createVoucherSchema) {}

export const updateVoucherSchema = z.object({
  invoice_id: z.string().min(1).optional(),
  voucher_number: z.string().min(1).optional(),
  voucher_date: z.string().min(1).optional(),
  payment_type: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE']).optional(),
  bank_id: z.string().min(1).optional(),
  amount: z.number().int().optional(),
  currency: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'PENDING', 'CLOSED']).optional(),
  remarks: z.string().min(1).optional(),
});

export class UpdateVoucherDto extends createZodDto(updateVoucherSchema) {}
