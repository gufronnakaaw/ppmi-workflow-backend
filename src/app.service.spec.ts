import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppService } from './app.service';
import { PrismaService } from './common/services/prisma.service';

describe('AppService', () => {
  let service: AppService;
  const prismaMock = {
    division: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<AppService>(AppService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists divisions ordered by name', async () => {
    prismaMock.division.findMany.mockResolvedValue([{ id: 'div-1' }]);

    const result = await service.listDivisions();

    expect(prismaMock.division.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual([{ id: 'div-1' }]);
  });

  it('gets division by id', async () => {
    prismaMock.division.findUnique.mockResolvedValue({ id: 'div-1' });

    const result = await service.getDivision('div-1');

    expect(prismaMock.division.findUnique).toHaveBeenCalledWith({
      where: { id: 'div-1' },
    });
    expect(result).toEqual({ id: 'div-1' });
  });

  it('creates division when not duplicate', async () => {
    prismaMock.division.findFirst.mockResolvedValue(null);
    prismaMock.division.create.mockResolvedValue({ id: 'div-1' });

    const result = await service.createDivision(
      { code: 'PI', name: 'P&I' },
      'Super Admin',
    );

    expect(prismaMock.division.findFirst).toHaveBeenCalled();
    expect(prismaMock.division.create).toHaveBeenCalledWith({
      data: {
        code: 'PI',
        name: 'P&I',
        description: undefined,
        created_by: 'Super Admin',
        updated_by: 'Super Admin',
      },
    });
    expect(result).toEqual({ id: 'div-1' });
  });

  it('rejects create when code or name duplicate', async () => {
    prismaMock.division.findFirst.mockResolvedValue({ id: 'div-1' });

    await expect(
      service.createDivision({ code: 'PI', name: 'P&I' }, 'Super Admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects update when division missing', async () => {
    prismaMock.division.findUnique.mockResolvedValue(null);

    await expect(
      service.updateDivision('div-1', { name: 'P&I' }, 'Super Admin'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update when code or name duplicate', async () => {
    prismaMock.division.findUnique.mockResolvedValue({ id: 'div-1' });
    prismaMock.division.findFirst.mockResolvedValue({ id: 'div-2' });

    await expect(
      service.updateDivision('div-1', { name: 'P&I' }, 'Super Admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates division when valid', async () => {
    prismaMock.division.findUnique.mockResolvedValue({ id: 'div-1' });
    prismaMock.division.findFirst.mockResolvedValue(null);
    prismaMock.division.update.mockResolvedValue({ id: 'div-1' });

    const result = await service.updateDivision(
      'div-1',
      { name: 'P&I Updated' },
      'Super Admin',
    );

    expect(prismaMock.division.update).toHaveBeenCalledWith({
      where: { id: 'div-1' },
      data: {
        code: undefined,
        name: 'P&I Updated',
        description: undefined,
        updated_by: 'Super Admin',
      },
    });
    expect(result).toEqual({ id: 'div-1' });
  });
});
