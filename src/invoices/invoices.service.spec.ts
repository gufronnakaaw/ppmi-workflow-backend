import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../common/services/prisma.service';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  const prismaMock = {
    invoice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    qS: {
      findFirst: vi.fn(),
    },
    log: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const createBody = {
    qs_id: 'qs-1',
    invoice_number: 'INV-NO-001',
    invoice_date: new Date('2026-01-10'),
    due_date: new Date('2026-01-31'),
    insured: 'PT. Alpha',
    amount: 1000,
    currency: 'USD',
    status: 'DRAFT',
    remarks: 'Initial invoice',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (payload: any) => {
      if (Array.isArray(payload)) {
        return Promise.all(payload);
      }

      return payload(prismaMock);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists invoices with filters, pagination, and sorting', async () => {
    prismaMock.invoice.findMany.mockResolvedValue([
      { id: 'inv-1', invoice_number: 'INV-NO-001' },
    ]);
    prismaMock.invoice.count.mockResolvedValue(11);

    const result = await service.listInvoices({
      status: 'draft',
      qs_id: 'qs-1',
      search: 'INV-NO-001',
      page: '2',
      limit: '5',
      sort_by: 'amount',
      sort_order: 'asc',
    });

    expect(prismaMock.invoice.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { is_deleted: false },
          { status: 'DRAFT' },
          { qs_id: 'qs-1' },
          {
            OR: [
              { id: { contains: 'INV-NO-001', mode: 'insensitive' } },
              {
                invoice_number: {
                  contains: 'INV-NO-001',
                  mode: 'insensitive',
                },
              },
              { insured: { contains: 'INV-NO-001', mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: { amount: 'asc' },
      skip: 5,
      take: 5,
      include: {
        qs: {
          select: {
            id: true,
            policy_number: true,
          },
        },
      },
    });
    expect(result).toEqual({
      items: [{ id: 'inv-1', invoice_number: 'INV-NO-001' }],
      total_pages: 3,
      current_page: 2,
    });
  });

  it('rejects list when status invalid', async () => {
    await expect(service.listInvoices({ status: 'invalid' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('gets invoice detail when found', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue({
      id: 'inv-1',
      invoice_number: 'INV-NO-001',
    });

    const result = await service.getInvoice('inv-1');

    expect(prismaMock.invoice.findFirst).toHaveBeenCalledWith({
      where: { id: 'inv-1', is_deleted: false },
      include: {
        qs: {
          select: {
            id: true,
            policy_number: true,
          },
        },
      },
    });
    expect(result).toEqual({ id: 'inv-1', invoice_number: 'INV-NO-001' });
  });

  it('rejects get when invoice missing', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue(null);

    await expect(service.getInvoice('inv-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects create when invoice number duplicate', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue({ id: 'inv-1' });

    await expect(
      service.createInvoice(createBody as any, 'Super Admin', 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects create when qs missing', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue(null);
    prismaMock.qS.findFirst.mockResolvedValue(null);

    await expect(
      service.createInvoice(createBody as any, 'Super Admin', 'admin-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates invoice and writes log when valid', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue(null);
    prismaMock.qS.findFirst.mockResolvedValue({ id: 'qs-1' });
    prismaMock.invoice.create.mockResolvedValue({ id: 'inv-1' });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.createInvoice(
      createBody as any,
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.invoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringMatching(/^INV-\d{8}-\d{3}$/),
        qs_id: 'qs-1',
        invoice_number: 'INV-NO-001',
      }),
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: {
        action: 'CREATE',
        reference_id: 'inv-1',
        reference_type: 'INVOICE',
        user_id: 'admin-1',
        description: 'Super Admin created a new invoice with number INV-NO-001',
      },
    });
    expect(result).toEqual({ id: 'inv-1' });
  });

  it('rejects update when invoice missing', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue(null);

    await expect(
      service.updateInvoice(
        'inv-1',
        { insured: 'PT. Beta' } as any,
        'Admin',
        '1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update when invoice number duplicate', async () => {
    prismaMock.invoice.findFirst
      .mockResolvedValueOnce({
        id: 'inv-1',
        qs_id: 'qs-1',
        invoice_number: 'INV-NO-001',
        invoice_date: new Date('2026-01-10'),
        due_date: new Date('2026-01-31'),
        insured: 'PT. Alpha',
        amount: 1000,
        currency: 'USD',
        status: 'DRAFT',
        remarks: 'Initial invoice',
        is_deleted: false,
      })
      .mockResolvedValueOnce({ id: 'inv-2' });

    await expect(
      service.updateInvoice(
        'inv-1',
        { invoice_number: 'INV-NO-002' } as any,
        'Admin',
        '1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects update when new qs is missing', async () => {
    prismaMock.invoice.findFirst.mockResolvedValueOnce({
      id: 'inv-1',
      qs_id: 'qs-1',
      invoice_number: 'INV-NO-001',
      invoice_date: new Date('2026-01-10'),
      due_date: new Date('2026-01-31'),
      insured: 'PT. Alpha',
      amount: 1000,
      currency: 'USD',
      status: 'DRAFT',
      remarks: 'Initial invoice',
      is_deleted: false,
    });
    prismaMock.qS.findFirst.mockResolvedValue(null);

    await expect(
      service.updateInvoice('inv-1', { qs_id: 'qs-2' } as any, 'Admin', '1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates invoice and writes log when valid', async () => {
    const existing = {
      id: 'inv-1',
      qs_id: 'qs-1',
      invoice_number: 'INV-NO-001',
      invoice_date: new Date('2026-01-10'),
      due_date: new Date('2026-01-31'),
      insured: 'PT. Alpha',
      amount: 1000,
      currency: 'USD',
      status: 'DRAFT',
      remarks: 'Initial invoice',
      is_deleted: false,
    };

    prismaMock.invoice.findFirst
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(null);
    prismaMock.invoice.update.mockResolvedValue({
      ...existing,
      insured: 'PT. Beta',
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.updateInvoice(
      'inv-1',
      { insured: 'PT. Beta' } as any,
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: expect.objectContaining({
        insured: 'PT. Beta',
      }),
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'UPDATE',
        reference_id: 'inv-1',
        reference_type: 'INVOICE',
        user_id: 'admin-1',
      }),
    });
    expect(result).toEqual({
      ...existing,
      insured: 'PT. Beta',
    });
  });

  it('rejects delete when invoice missing', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue(null);

    await expect(service.deleteInvoice('inv-1', 'Admin', '1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('soft deletes invoice and writes log when valid', async () => {
    prismaMock.invoice.findFirst.mockResolvedValue({
      id: 'inv-1',
      invoice_number: 'INV-NO-001',
      is_deleted: false,
      deleted_at: null,
    });
    prismaMock.invoice.update.mockResolvedValue({
      id: 'inv-1',
      is_deleted: true,
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.deleteInvoice(
      'inv-1',
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.invoice.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        is_deleted: true,
        deleted_at: expect.any(Date),
      },
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DELETE',
        reference_id: 'inv-1',
        reference_type: 'INVOICE',
        user_id: 'admin-1',
      }),
    });
    expect(result).toEqual({ id: 'inv-1', is_deleted: true });
  });
});
