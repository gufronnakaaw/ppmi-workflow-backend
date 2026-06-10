import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../common/services/prisma.service';
import { VouchersService } from './vouchers.service';

describe('VouchersService', () => {
  let service: VouchersService;
  const prismaMock = {
    voucher: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      findFirst: vi.fn(),
    },
    bank: {
      findFirst: vi.fn(),
    },
    log: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const createBody = {
    invoice_id: 'inv-1',
    voucher_number: 'VCH-001',
    voucher_date: '2026-06-10',
    payment_type: 'BANK_TRANSFER',
    bank_id: 'bank-1',
    amount: 1500,
    currency: 'USD',
    status: 'DRAFT',
    remarks: 'Initial voucher',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VouchersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<VouchersService>(VouchersService);
    vi.resetAllMocks();
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

  it('lists vouchers with filters, pagination, and sorting', async () => {
    prismaMock.voucher.findMany.mockResolvedValue([
      { id: 'vch-1', voucher_number: 'VCH-001' },
    ]);
    prismaMock.voucher.count.mockResolvedValue(11);

    const result = await service.listVouchers({
      status: 'draft',
      payment_type: 'cash',
      bank_id: 'bank-1',
      invoice_id: 'inv-1',
      search: 'VCH-001',
      page: '2',
      limit: '5',
      sort_by: 'amount',
      sort_order: 'asc',
    });

    expect(prismaMock.voucher.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { is_deleted: false },
          { status: 'DRAFT' },
          { payment_type: 'CASH' },
          { bank_id: 'bank-1' },
          { invoice_id: 'inv-1' },
          {
            OR: [
              { id: { contains: 'VCH-001', mode: 'insensitive' } },
              {
                voucher_number: {
                  contains: 'VCH-001',
                  mode: 'insensitive',
                },
              },
              { currency: { contains: 'VCH-001', mode: 'insensitive' } },
              { remarks: { contains: 'VCH-001', mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: { amount: 'asc' },
      skip: 5,
      take: 5,
      include: {
        invoice: {
          select: {
            id: true,
            invoice_number: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    expect(result).toEqual({
      items: [{ id: 'vch-1', voucher_number: 'VCH-001' }],
      total_pages: 3,
      current_page: 2,
    });
  });

  it('rejects list when status invalid', async () => {
    await expect(service.listVouchers({ status: 'invalid' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('gets voucher detail when found', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue({
      id: 'vch-1',
      voucher_number: 'VCH-001',
    });

    const result = await service.getVoucher('vch-1');

    expect(prismaMock.voucher.findFirst).toHaveBeenCalledWith({
      where: { id: 'vch-1', is_deleted: false },
      include: {
        invoice: {
          select: {
            id: true,
            invoice_number: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    expect(result).toEqual({ id: 'vch-1', voucher_number: 'VCH-001' });
  });

  it('rejects get when voucher missing', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue(null);

    await expect(service.getVoucher('vch-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects create when voucher number duplicate', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue({ id: 'vch-1' });

    await expect(
      service.createVoucher(createBody as any, 'Super Admin', 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects create when invoice missing', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue(null);
    prismaMock.invoice.findFirst.mockResolvedValue(null);

    await expect(
      service.createVoucher(createBody as any, 'Super Admin', 'admin-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects create when bank missing', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue(null);
    prismaMock.invoice.findFirst
      .mockResolvedValueOnce({ id: 'inv-1' })
      .mockResolvedValueOnce(null);

    await expect(
      service.createVoucher(createBody as any, 'Super Admin', 'admin-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('creates voucher and writes log when valid', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue(null);
    prismaMock.invoice.findFirst.mockResolvedValue({ id: 'inv-1' });
    prismaMock.bank.findFirst.mockResolvedValue({ id: 'bank-1' });
    prismaMock.voucher.create.mockResolvedValue({ id: 'vch-1' });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.createVoucher(
      createBody as any,
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.voucher.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringMatching(/^VCH-\d{8}-\d{3}$/),
        invoice_id: 'inv-1',
        voucher_number: 'VCH-001',
      }),
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: {
        action: 'CREATE',
        reference_id: 'vch-1',
        reference_type: 'INVOICE',
        user_id: 'admin-1',
        description: 'Super Admin created a new voucher with number VCH-001',
      },
    });
    expect(result).toEqual({ id: 'vch-1' });
  });

  it('rejects update when voucher missing', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue(null);

    await expect(
      service.updateVoucher(
        'vch-1',
        { remarks: 'Updated' } as any,
        'Admin',
        '1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update when voucher number duplicate', async () => {
    prismaMock.voucher.findFirst
      .mockResolvedValueOnce({
        id: 'vch-1',
        invoice_id: 'inv-1',
        voucher_number: 'VCH-001',
        voucher_date: '2026-06-10',
        payment_type: 'BANK_TRANSFER',
        bank_id: 'bank-1',
        amount: 1500,
        currency: 'USD',
        status: 'DRAFT',
        remarks: 'Initial voucher',
        is_deleted: false,
      })
      .mockResolvedValueOnce({ id: 'vch-2' });

    await expect(
      service.updateVoucher(
        'vch-1',
        { voucher_number: 'VCH-002' } as any,
        'Admin',
        '1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects update when invoice missing', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue({
      id: 'vch-1',
      invoice_id: 'inv-1',
      voucher_number: 'VCH-001',
      voucher_date: '2026-06-10',
      payment_type: 'BANK_TRANSFER',
      bank_id: 'bank-1',
      amount: 1500,
      currency: 'USD',
      status: 'DRAFT',
      remarks: 'Initial voucher',
      is_deleted: false,
    });
    prismaMock.invoice.findFirst.mockResolvedValue(null);

    await expect(
      service.updateVoucher(
        'vch-1',
        { invoice_id: 'inv-2' } as any,
        'Admin',
        '1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update when bank missing', async () => {
    prismaMock.voucher.findFirst.mockResolvedValueOnce({
      id: 'vch-1',
      invoice_id: 'inv-1',
      voucher_number: 'VCH-001',
      voucher_date: '2026-06-10',
      payment_type: 'BANK_TRANSFER',
      bank_id: 'bank-1',
      amount: 1500,
      currency: 'USD',
      status: 'DRAFT',
      remarks: 'Initial voucher',
      is_deleted: false,
    });
    prismaMock.bank.findFirst.mockResolvedValue(null);

    await expect(
      service.updateVoucher(
        'vch-1',
        { bank_id: 'bank-2' } as any,
        'Admin',
        '1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates voucher and writes log when valid', async () => {
    const existing = {
      id: 'vch-1',
      invoice_id: 'inv-1',
      voucher_number: 'VCH-001',
      voucher_date: '2026-06-10',
      payment_type: 'BANK_TRANSFER',
      bank_id: 'bank-1',
      amount: 1500,
      currency: 'USD',
      status: 'DRAFT',
      remarks: 'Initial voucher',
      is_deleted: false,
    };

    prismaMock.voucher.findFirst
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'bank-1' });
    prismaMock.voucher.update.mockResolvedValue({
      ...existing,
      remarks: 'Updated voucher',
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.updateVoucher(
      'vch-1',
      { remarks: 'Updated voucher' } as any,
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.voucher.update).toHaveBeenCalledWith({
      where: { id: 'vch-1' },
      data: expect.objectContaining({
        remarks: 'Updated voucher',
      }),
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'UPDATE',
        reference_id: 'vch-1',
        reference_type: 'INVOICE',
        user_id: 'admin-1',
      }),
    });
    expect(result).toEqual({
      ...existing,
      remarks: 'Updated voucher',
    });
  });

  it('rejects delete when voucher missing', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue(null);

    await expect(service.deleteVoucher('vch-1', 'Admin', '1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('soft deletes voucher and writes log when valid', async () => {
    prismaMock.voucher.findFirst.mockResolvedValue({
      id: 'vch-1',
      voucher_number: 'VCH-001',
      is_deleted: false,
      deleted_at: null,
    });
    prismaMock.voucher.update.mockResolvedValue({
      id: 'vch-1',
      is_deleted: true,
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.deleteVoucher(
      'vch-1',
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.voucher.update).toHaveBeenCalledWith({
      where: { id: 'vch-1' },
      data: {
        is_deleted: true,
        deleted_at: expect.any(Date),
      },
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DELETE',
        reference_id: 'vch-1',
        reference_type: 'INVOICE',
        user_id: 'admin-1',
      }),
    });
    expect(result).toEqual({ id: 'vch-1', is_deleted: true });
  });
});
