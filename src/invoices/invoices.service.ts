import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { InvoiceStatus, Prisma } from '../generated/prisma/client';
import { CreateInvoiceDto, UpdateInvoiceDto } from './invoices.validation';

@Injectable()
export class InvoicesService {
  constructor(private readonly prismaService: PrismaService) {}

  private formatDateId(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  async listInvoices(filters: {
    status?: string | string[];
    qs_id?: string | string[];
    search?: string | string[];
    page?: string | string[];
    limit?: string | string[];
    sort_by?: string | string[];
    sort_order?: string | string[];
  }) {
    const toSingleValue = (value?: string | string[]) => {
      if (!value) {
        return undefined;
      }

      if (Array.isArray(value)) {
        return value.map((item) => item.trim()).find(Boolean);
      }

      return value.trim();
    };

    const normalizeEnum = <T extends string>(
      value: string | string[] | undefined,
      allowed: readonly T[],
      label: string,
    ) => {
      const normalizedValues = (Array.isArray(value) ? value : [value])
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);

      if (normalizedValues.some((item) => item.toUpperCase() === 'ALL')) {
        return undefined;
      }

      const normalized = normalizedValues[0];

      if (!normalized) {
        return undefined;
      }

      const upper = normalized.toUpperCase();

      if (!allowed.includes(upper as T)) {
        throw new BadRequestException(`Invalid ${label}`);
      }

      return upper as T;
    };

    const status = normalizeEnum(
      filters.status,
      Object.values(InvoiceStatus),
      'status',
    );
    const qsId = toSingleValue(filters.qs_id);
    const searchTerm = toSingleValue(filters.search);
    const pageRaw = toSingleValue(filters.page);
    const limitRaw = toSingleValue(filters.limit);
    const sortByRaw = toSingleValue(filters.sort_by);
    const sortOrderRaw = toSingleValue(filters.sort_order);

    const page = pageRaw ? Number(pageRaw) : 1;
    const limit = limitRaw ? Number(limitRaw) : 10;

    if (!Number.isFinite(page) || page < 1) {
      throw new BadRequestException('Invalid page');
    }

    if (!Number.isFinite(limit) || limit < 1) {
      throw new BadRequestException('Invalid limit');
    }

    const sortBy = (sortByRaw ?? 'created_at').toLowerCase();
    const sortOrder = (sortOrderRaw ?? 'desc').toLowerCase();

    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      throw new BadRequestException('Invalid sort_order');
    }

    const sortFieldMap: Record<
      string,
      keyof Prisma.InvoiceOrderByWithRelationInput
    > = {
      invoice_id: 'id',
      id: 'id',
      invoice_number: 'invoice_number',
      insured: 'insured',
      amount: 'amount',
      invoice_date: 'invoice_date',
      due_date: 'due_date',
      created_at: 'created_at',
      updated_at: 'updated_at',
    };

    const sortField = sortFieldMap[sortBy];

    if (!sortField) {
      throw new BadRequestException('Invalid sort_by');
    }

    const AND: Prisma.InvoiceWhereInput[] = [{ is_deleted: false }];

    if (status) {
      AND.push({ status });
    }

    if (qsId) {
      AND.push({ qs_id: qsId });
    }

    if (searchTerm && searchTerm.length > 0) {
      AND.push({
        OR: [
          { id: { contains: searchTerm, mode: 'insensitive' } },
          { invoice_number: { contains: searchTerm, mode: 'insensitive' } },
          { insured: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {
      [sortField]: sortOrder,
    };

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.invoice.findMany({
        where: { AND },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          qs: {
            select: {
              id: true,
              policy_number: true,
            },
          },
        },
      }),
      this.prismaService.invoice.count({ where: { AND } }),
    ]);

    return {
      items,
      total_pages: Math.ceil(total / limit),
      current_page: page,
    };
  }

  async getInvoice(id: string) {
    const invoice = await this.prismaService.invoice.findFirst({
      where: { id, is_deleted: false },
      include: {
        qs: {
          select: {
            id: true,
            policy_number: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async createInvoice(
    body: CreateInvoiceDto,
    fullname: string,
    user_id: string,
  ) {
    const duplicate = await this.prismaService.invoice.findFirst({
      where: {
        invoice_number: body.invoice_number,
        is_deleted: false,
      },
    });

    if (duplicate) {
      throw new BadRequestException('Invoice number already exists');
    }

    const qs = await this.prismaService.qS.findFirst({
      where: {
        id: body.qs_id,
        is_deleted: false,
      },
      select: {
        id: true,
      },
    });

    if (!qs) {
      throw new NotFoundException('QS not found');
    }

    const datePart = this.formatDateId(new Date());
    const prefix = `INV-${datePart}-`;

    const invoice = await this.prismaService.$transaction(async (prisma) => {
      const latest = await prisma.invoice.findFirst({
        where: {
          id: {
            startsWith: prefix,
          },
        },
        orderBy: {
          id: 'desc',
        },
        select: {
          id: true,
        },
      });

      const lastSequence = latest?.id
        ? Number(latest.id.slice(prefix.length))
        : 0;
      const nextSequence =
        Number.isFinite(lastSequence) && lastSequence > 0
          ? lastSequence + 1
          : 1;
      const invoiceId = `${prefix}${String(nextSequence).padStart(3, '0')}`;

      const create = await prisma.invoice.create({
        data: {
          id: invoiceId,
          qs_id: body.qs_id,
          invoice_number: body.invoice_number,
          invoice_date: body.invoice_date,
          due_date: body.due_date,
          insured: body.insured,
          amount: body.amount,
          currency: body.currency,
          status: body.status,
          remarks: body.remarks,
        },
      });

      await prisma.log.create({
        data: {
          action: 'CREATE',
          reference_id: create.id,
          reference_type: 'INVOICE',
          user_id,
          description: `${fullname} created a new invoice with number ${body.invoice_number}`,
        },
      });

      return create;
    });

    return invoice;
  }

  async updateInvoice(
    id: string,
    body: UpdateInvoiceDto,
    fullname: string,
    user_id: string,
  ) {
    const existing = await this.prismaService.invoice.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    const nextInvoiceNumber = body.invoice_number ?? existing.invoice_number;

    if (
      body.invoice_number &&
      body.invoice_number !== existing.invoice_number
    ) {
      const duplicate = await this.prismaService.invoice.findFirst({
        where: {
          id: { not: id },
          invoice_number: nextInvoiceNumber,
          is_deleted: false,
        },
      });

      if (duplicate) {
        throw new BadRequestException('Invoice number already exists');
      }
    }

    if (body.qs_id && body.qs_id !== existing.qs_id) {
      const qs = await this.prismaService.qS.findFirst({
        where: {
          id: body.qs_id,
          is_deleted: false,
        },
        select: {
          id: true,
        },
      });

      if (!qs) {
        throw new NotFoundException('QS not found');
      }
    }

    const invoice = await this.prismaService.$transaction(async (prisma) => {
      const update = await prisma.invoice.update({
        where: { id },
        data: {
          qs_id: body.qs_id,
          invoice_number: body.invoice_number,
          invoice_date: body.invoice_date,
          due_date: body.due_date,
          insured: body.insured,
          amount: body.amount,
          currency: body.currency,
          status: body.status,
          remarks: body.remarks,
        },
      });

      await prisma.log.create({
        data: {
          action: 'UPDATE',
          reference_id: id,
          reference_type: 'INVOICE',
          user_id,
          description: `${fullname} updated invoice number ${existing.invoice_number}`,
          details: JSON.stringify({
            before: {
              qs_id: existing.qs_id,
              invoice_number: existing.invoice_number,
              invoice_date: existing.invoice_date,
              due_date: existing.due_date,
              insured: existing.insured,
              amount: existing.amount,
              currency: existing.currency,
              status: existing.status,
              remarks: existing.remarks,
              is_deleted: existing.is_deleted,
            },
            after: {
              qs_id: update.qs_id,
              invoice_number: update.invoice_number,
              invoice_date: update.invoice_date,
              due_date: update.due_date,
              insured: update.insured,
              amount: update.amount,
              currency: update.currency,
              status: update.status,
              remarks: update.remarks,
              is_deleted: update.is_deleted,
            },
          }),
        },
      });

      return update;
    });

    return invoice;
  }

  async deleteInvoice(id: string, fullname: string, user_id: string) {
    const existing = await this.prismaService.invoice.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    const deletedAt = new Date();

    const invoice = await this.prismaService.$transaction(async (prisma) => {
      const update = await prisma.invoice.update({
        where: { id },
        data: {
          is_deleted: true,
          deleted_at: deletedAt,
        },
      });

      await prisma.log.create({
        data: {
          action: 'DELETE',
          reference_id: id,
          reference_type: 'INVOICE',
          user_id,
          description: `${fullname} deleted invoice ${existing.invoice_number}`,
          details: JSON.stringify({
            before: {
              invoice_number: existing.invoice_number,
              is_deleted: existing.is_deleted,
              deleted_at: existing.deleted_at,
            },
            after: {
              is_deleted: true,
              deleted_at: deletedAt,
            },
          }),
        },
      });

      return update;
    });

    return invoice;
  }
}
