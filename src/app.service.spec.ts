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
    role: {
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
    prismaMock.division.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.division.create.mockResolvedValue({ id: 'div-1' });

    const result = await service.createDivision({ name: 'P&I' }, 'Super Admin');

    expect(prismaMock.division.findFirst).toHaveBeenCalled();
    expect(prismaMock.division.create).toHaveBeenCalledWith({
      data: {
        code: expect.stringMatching(/^PPMID-\d{4}$/),
        name: 'P&I',
        description: undefined,
        created_by: 'Super Admin',
        updated_by: 'Super Admin',
      },
    });
    expect(result).toEqual({ id: 'div-1' });
  });

  it('rejects create when name duplicate', async () => {
    prismaMock.division.findFirst.mockResolvedValue({ id: 'div-1' });

    await expect(
      service.createDivision({ name: 'P&I' }, 'Super Admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects update when division missing', async () => {
    prismaMock.division.findUnique.mockResolvedValue(null);

    await expect(
      service.updateDivision('div-1', { name: 'P&I' }, 'Super Admin'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update when name duplicate', async () => {
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
        name: 'P&I Updated',
        description: undefined,
        updated_by: 'Super Admin',
      },
    });
    expect(result).toEqual({ id: 'div-1' });
  });

  it('lists roles ordered by name', async () => {
    prismaMock.role.findMany.mockResolvedValue([{ id: 'role-1' }]);

    const result = await service.listRoles();

    expect(prismaMock.role.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual([{ id: 'role-1' }]);
  });

  it('gets role by id', async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: 'role-1' });

    const result = await service.getRole('role-1');

    expect(prismaMock.role.findUnique).toHaveBeenCalledWith({
      where: { id: 'role-1' },
    });
    expect(result).toEqual({ id: 'role-1' });
  });

  it('creates role when not duplicate', async () => {
    prismaMock.role.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaMock.role.create.mockResolvedValue({ id: 'role-1' });

    const result = await service.createRole({ name: 'Editor' }, 'Super Admin');

    expect(prismaMock.role.findFirst).toHaveBeenCalled();
    expect(prismaMock.role.create).toHaveBeenCalledWith({
      data: {
        code: expect.stringMatching(/^PPMIR-\d{4}$/),
        name: 'Editor',
        description: undefined,
        created_by: 'Super Admin',
        updated_by: 'Super Admin',
      },
    });
    expect(result).toEqual({ id: 'role-1' });
  });

  it('rejects create when role name duplicate', async () => {
    prismaMock.role.findFirst.mockResolvedValue({ id: 'role-1' });

    await expect(
      service.createRole({ name: 'Editor' }, 'Super Admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects update when role missing', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null);

    await expect(
      service.updateRole('role-1', { name: 'Editor' }, 'Super Admin'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update when role name duplicate', async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: 'role-1' });
    prismaMock.role.findFirst.mockResolvedValue({ id: 'role-2' });

    await expect(
      service.updateRole('role-1', { name: 'Editor' }, 'Super Admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates role when valid', async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: 'role-1' });
    prismaMock.role.findFirst.mockResolvedValue(null);
    prismaMock.role.update.mockResolvedValue({ id: 'role-1' });

    const result = await service.updateRole(
      'role-1',
      { name: 'Editor Updated' },
      'Super Admin',
    );

    expect(prismaMock.role.update).toHaveBeenCalledWith({
      where: { id: 'role-1' },
      data: {
        name: 'Editor Updated',
        description: undefined,
        updated_by: 'Super Admin',
      },
    });
    expect(result).toEqual({ id: 'role-1' });
  });
});
