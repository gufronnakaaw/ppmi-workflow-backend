import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  qs_id: z.string().min(1),
  invoice_number: z.string().min(1),
  invoice_date: z.string().min(1),
  due_date: z.string().min(1),
  insured: z.string().min(1),
  amount: z.number().int(),
  currency: z.string().min(1),
  status: z.enum(['DRAFT', 'PENDING', 'VOUCHER', 'CLOSED']),
  remarks: z.string().min(1),
});

export class CreateInvoiceDto extends createZodDto(createInvoiceSchema) {}

export const updateInvoiceSchema = z.object({
  qs_id: z.string().min(1).optional(),
  invoice_number: z.string().min(1).optional(),
  invoice_date: z.string().min(1).optional(),
  due_date: z.string().min(1).optional(),
  insured: z.string().min(1).optional(),
  amount: z.number().int().optional(),
  currency: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'PENDING', 'VOUCHER', 'CLOSED']).optional(),
  remarks: z.string().min(1).optional(),
});

export class UpdateInvoiceDto extends createZodDto(updateInvoiceSchema) {}
