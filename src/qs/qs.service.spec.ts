import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../common/services/prisma.service';
import { QsService } from './qs.service';

describe('QsService', () => {
  let service: QsService;
  const prismaMock = {
    qS: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    log: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const createBody = {
    division_id: 'div-1',
    type: 'NEW',
    status: 'DRAFT',
    insured: 'PT. Alpha',
    vessel: 'Sea Star',
    insurance: 'Insurance A',
    member: 'Member A',
    leader: 'Leader A',
    policy_number: 'POL-001',
    period_from: new Date('2025-01-01'),
    period_to: new Date('2025-12-31'),
    premium_amount: 1000,
    currency: 'USD',
    remarks: 'Remark',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<QsService>(QsService);
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

  it('lists qs with filters, pagination, and sorting', async () => {
    prismaMock.qS.findMany.mockResolvedValue([
      { id: 'qs-1', division: { name: 'P&I' } },
    ]);
    prismaMock.qS.count.mockResolvedValue(11);

    const result = await service.listQs({
      status: 'draft',
      type: 'renewal',
      division: 'P&I, H&M',
      search: 'qs-1',
      page: '2',
      limit: '5',
      sort_by: 'premium',
      sort_order: 'asc',
    });

    expect(prismaMock.qS.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { is_deleted: false },
          { status: 'DRAFT' },
          { type: 'RENEWAL' },
          {
            OR: [
              {
                division: {
                  is: {
                    name: {
                      equals: 'P&I',
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                division: {
                  is: {
                    name: {
                      equals: 'H&M',
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          },
          {
            OR: [
              { id: { contains: 'qs-1', mode: 'insensitive' } },
              { insured: { contains: 'qs-1', mode: 'insensitive' } },
              { vessel: { contains: 'qs-1', mode: 'insensitive' } },
            ],
          },
        ],
      },
      orderBy: { premium_amount: 'asc' },
      skip: 5,
      take: 5,
      include: {
        division: {
          select: {
            name: true,
          },
        },
      },
    });
    expect(prismaMock.qS.count).toHaveBeenCalledWith({
      where: {
        AND: expect.any(Array),
      },
    });
    expect(result).toEqual({
      items: [{ id: 'qs-1', division: 'P&I' }],
      total_pages: 3,
      current_page: 2,
    });
  });

  it('rejects list when status invalid', async () => {
    await expect(service.listQs({ status: 'invalid' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('ignores filters when status/type/division is ALL', async () => {
    prismaMock.qS.findMany.mockResolvedValue([]);
    prismaMock.qS.count.mockResolvedValue(0);

    const result = await service.listQs({
      status: 'ALL',
      type: 'all',
      division: 'ALL',
    });

    expect(prismaMock.qS.findMany).toHaveBeenCalledWith({
      where: { AND: [{ is_deleted: false }] },
      orderBy: { created_at: 'desc' },
      skip: 0,
      take: 10,
      include: {
        division: {
          select: {
            name: true,
          },
        },
      },
    });
    expect(result).toEqual({
      items: [],
      total_pages: 0,
      current_page: 1,
    });
  });

  it('gets qs detail when found', async () => {
    prismaMock.qS.findFirst.mockResolvedValue({
      id: 'qs-1',
      division: { name: 'P&I' },
    });

    const result = await service.getQs('qs-1');

    expect(prismaMock.qS.findFirst).toHaveBeenCalledWith({
      where: { id: 'qs-1', is_deleted: false },
      include: {
        division: {
          select: { name: true },
        },
      },
    });
    expect(result).toEqual({ id: 'qs-1', division: 'P&I' });
  });

  it('rejects get when qs missing', async () => {
    prismaMock.qS.findFirst.mockResolvedValue(null);

    await expect(service.getQs('qs-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects create when policy number duplicate', async () => {
    prismaMock.qS.findFirst.mockResolvedValue({ id: 'qs-1' });

    await expect(
      service.createQs(createBody as any, 'Super Admin', 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates qs and writes log when valid', async () => {
    prismaMock.qS.findFirst.mockResolvedValue(null);
    prismaMock.qS.create.mockResolvedValue({ id: 'qs-1' });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.createQs(
      createBody as any,
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.qS.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringMatching(/^QS-\d{8}-\d{3}$/),
        division_id: 'div-1',
        policy_number: 'POL-001',
      }),
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: {
        action: 'CREATE',
        reference_id: 'qs-1',
        reference_type: 'QS',
        user_id: 'admin-1',
        description: 'Super Admin created a new QS with policy number POL-001',
      },
    });
    expect(result).toEqual({ id: 'qs-1' });
  });

  it('rejects update when qs missing', async () => {
    prismaMock.qS.findFirst.mockResolvedValue(null);

    await expect(
      service.updateQs('qs-1', { insured: 'PT. Beta' } as any, 'Admin', '1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update when policy number duplicate', async () => {
    prismaMock.qS.findFirst
      .mockResolvedValueOnce({
        id: 'qs-1',
        division_id: 'div-1',
        policy_number: 'POL-001',
        type: 'NEW',
        status: 'DRAFT',
        insured: 'PT. Alpha',
        vessel: 'Sea Star',
        insurance: 'Insurance A',
        member: 'Member A',
        leader: 'Leader A',
        period_from: new Date('2025-01-01'),
        period_to: new Date('2025-12-31'),
        premium_amount: 1000,
        currency: 'USD',
        remarks: 'Remark',
        is_deleted: false,
      })
      .mockResolvedValueOnce({ id: 'qs-2' });

    await expect(
      service.updateQs(
        'qs-1',
        { policy_number: 'POL-002' } as any,
        'Admin',
        '1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates qs and writes log when valid', async () => {
    const existing = {
      id: 'qs-1',
      division_id: 'div-1',
      policy_number: 'POL-001',
      type: 'NEW',
      status: 'DRAFT',
      insured: 'PT. Alpha',
      vessel: 'Sea Star',
      insurance: 'Insurance A',
      member: 'Member A',
      leader: 'Leader A',
      period_from: new Date('2025-01-01'),
      period_to: new Date('2025-12-31'),
      premium_amount: 1000,
      currency: 'USD',
      remarks: 'Remark',
      is_deleted: false,
    };

    prismaMock.qS.findFirst
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(null);
    prismaMock.qS.update.mockResolvedValue({
      ...existing,
      insured: 'PT. Beta',
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.updateQs(
      'qs-1',
      { insured: 'PT. Beta' } as any,
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.qS.update).toHaveBeenCalledWith({
      where: { id: 'qs-1' },
      data: expect.objectContaining({
        insured: 'PT. Beta',
      }),
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'UPDATE',
        reference_id: 'qs-1',
        reference_type: 'QS',
        user_id: 'admin-1',
      }),
    });
    expect(result).toEqual({ ...existing, insured: 'PT. Beta' });
  });

  it('rejects delete when qs missing', async () => {
    prismaMock.qS.findFirst.mockResolvedValue(null);

    await expect(service.deleteQs('qs-1', 'Admin', '1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('soft deletes qs and writes log when valid', async () => {
    prismaMock.qS.findFirst.mockResolvedValue({
      id: 'qs-1',
      policy_number: 'POL-001',
      is_deleted: false,
      deleted_at: null,
    });
    prismaMock.qS.update.mockResolvedValue({ id: 'qs-1', is_deleted: true });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.deleteQs('qs-1', 'Super Admin', 'admin-1');

    expect(prismaMock.qS.update).toHaveBeenCalledWith({
      where: { id: 'qs-1' },
      data: {
        is_deleted: true,
        deleted_at: expect.any(Date),
      },
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DELETE',
        reference_id: 'qs-1',
        reference_type: 'QS',
        user_id: 'admin-1',
      }),
    });
    expect(result).toEqual({ id: 'qs-1', is_deleted: true });
  });
});
