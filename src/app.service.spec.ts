import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppService } from './app.service';
import { PrismaService } from './common/services/prisma.service';
import { hashPassword } from './utils/bcrypt.util';

vi.mock('./utils/bcrypt.util', () => ({
  hashPassword: vi.fn(),
}));

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
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    userRole: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    userDivision: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    log: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<AppService>(AppService);
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback(prismaMock),
    );
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
    prismaMock.division.create.mockResolvedValue({
      id: 'div-1',
      code: 'PPMID-1234',
      name: 'P&I',
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.createDivision(
      { name: 'P&I' },
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.division.findFirst).toHaveBeenCalled();
    expect(prismaMock.division.create).toHaveBeenCalledWith({
      data: {
        code: expect.stringMatching(/^PPMID-\d{4}$/),
        name: 'P&I',
        description: undefined,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: {
        action: 'CREATE',
        reference_id: 'div-1',
        reference_type: 'DIVISION',
        user_id: 'admin-1',
        description: 'Super Admin created a new division with name P&I',
      },
    });
    expect(result).toEqual({ id: 'div-1', code: 'PPMID-1234', name: 'P&I' });
  });

  it('rejects create when name duplicate', async () => {
    prismaMock.division.findFirst.mockResolvedValue({ id: 'div-1' });

    await expect(
      service.createDivision({ name: 'P&I' }, 'Super Admin', 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects update when division missing', async () => {
    prismaMock.division.findUnique.mockResolvedValue(null);

    await expect(
      service.updateDivision(
        'div-1',
        { name: 'P&I' },
        'Super Admin',
        'admin-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update when name duplicate', async () => {
    prismaMock.division.findUnique.mockResolvedValue({ id: 'div-1' });
    prismaMock.division.findFirst.mockResolvedValue({ id: 'div-2' });

    await expect(
      service.updateDivision(
        'div-1',
        { name: 'P&I' },
        'Super Admin',
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates division when valid', async () => {
    prismaMock.division.findUnique.mockResolvedValue({
      id: 'div-1',
      name: 'P&I',
      description: 'Old',
    });
    prismaMock.division.findFirst.mockResolvedValue(null);
    prismaMock.division.update.mockResolvedValue({
      id: 'div-1',
      code: 'PPMID-1234',
      name: 'P&I Updated',
      description: 'New',
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.updateDivision(
      'div-1',
      { name: 'P&I Updated' },
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.division.update).toHaveBeenCalledWith({
      where: { id: 'div-1' },
      data: {
        name: 'P&I Updated',
        description: undefined,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: {
        action: 'UPDATE',
        reference_id: 'div-1',
        reference_type: 'DIVISION',
        user_id: 'admin-1',
        description: expect.stringContaining('Super Admin updated a'),
        details: expect.any(String),
      },
    });
    expect(result).toEqual({
      id: 'div-1',
      code: 'PPMID-1234',
      name: 'P&I Updated',
      description: 'New',
    });
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
    prismaMock.role.findFirst.mockResolvedValue(null);
    prismaMock.role.create.mockResolvedValue({
      id: 'role-1',
      code: 'PPMIR-1234',
      name: 'Editor',
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.createRole(
      { name: 'Editor' },
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.role.findFirst).toHaveBeenCalled();
    expect(prismaMock.role.create).toHaveBeenCalledWith({
      data: {
        code: expect.stringMatching(/^PPMIR-\d{4}$/),
        name: 'Editor',
        description: undefined,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: {
        action: 'CREATE',
        reference_id: 'role-1',
        reference_type: 'ROLE',
        user_id: 'admin-1',
        description: 'Super Admin created a new role with name Editor',
      },
    });
    expect(result).toEqual({
      id: 'role-1',
      code: 'PPMIR-1234',
      name: 'Editor',
    });
  });

  it('rejects create when role name duplicate', async () => {
    prismaMock.role.findFirst.mockResolvedValue({ id: 'role-1' });

    await expect(
      service.createRole({ name: 'Editor' }, 'Super Admin', 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects update when role missing', async () => {
    prismaMock.role.findUnique.mockResolvedValue(null);

    await expect(
      service.updateRole(
        'role-1',
        { name: 'Editor' },
        'Super Admin',
        'admin-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects update when role name duplicate', async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: 'role-1' });
    prismaMock.role.findFirst.mockResolvedValue({ id: 'role-2' });

    await expect(
      service.updateRole(
        'role-1',
        { name: 'Editor' },
        'Super Admin',
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates role when valid', async () => {
    prismaMock.role.findUnique.mockResolvedValue({
      id: 'role-1',
      name: 'Editor',
      description: 'Old',
    });
    prismaMock.role.findFirst.mockResolvedValue(null);
    prismaMock.role.update.mockResolvedValue({
      id: 'role-1',
      code: 'PPMIR-1234',
      name: 'Editor Updated',
      description: 'New',
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.updateRole(
      'role-1',
      { name: 'Editor Updated' },
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.role.update).toHaveBeenCalledWith({
      where: { id: 'role-1' },
      data: {
        name: 'Editor Updated',
        description: undefined,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: {
        action: 'UPDATE',
        reference_id: 'role-1',
        reference_type: 'ROLE',
        user_id: 'admin-1',
        description: expect.stringContaining('Super Admin updated a'),
        details: expect.any(String),
      },
    });
    expect(result).toEqual({
      id: 'role-1',
      code: 'PPMIR-1234',
      name: 'Editor Updated',
      description: 'New',
    });
  });

  it('lists users by division when provided', async () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        fullname: 'User One',
        email: 'user1@example.com',
        created_at: createdAt,
        is_admin: false,
        divisions: [
          { division: { name: 'P&I' } },
          { division: { name: 'Marine' } },
        ],
      },
    ]);

    const result = await service.listUsers('P&I');

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {
        AND: [{ division: { name: 'P&I' } }, { is_admin: false }],
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        created_at: true,
        is_admin: true,
        divisions: {
          select: {
            division: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    expect(result).toEqual([
      {
        id: 'user-1',
        fullname: 'User One',
        email: 'user1@example.com',
        created_at: createdAt,
        is_admin: false,
        divisions: ['P&I', 'Marine'],
      },
    ]);
  });

  it('lists users when division is not provided', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await service.listUsers('');

    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: {
        AND: [{ is_admin: false }],
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        created_at: true,
        is_admin: true,
        divisions: {
          select: {
            division: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    expect(result).toEqual([]);
  });

  it('gets user detail', async () => {
    const createdAt = new Date('2024-01-02T00:00:00.000Z');
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullname: 'User One',
      email: 'user1@example.com',
      created_at: createdAt,
      is_admin: false,
    });

    const result = await service.getUser('user-1');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        fullname: true,
        email: true,
        created_at: true,
        is_admin: true,
      },
    });
    expect(result).toEqual({
      id: 'user-1',
      fullname: 'User One',
      email: 'user1@example.com',
      created_at: createdAt,
      is_admin: false,
    });
  });

  it('rejects update user when missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.updateUser(
        'user-1',
        {
          fullname: 'User Updated',
          email: 'user@example.com',
          password: 'secret123',
        },
        'Super Admin',
        'admin-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates user with roles and divisions', async () => {
    vi.mocked(hashPassword).mockResolvedValue('hashed');
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullname: 'User One',
      email: 'user1@example.com',
      phone: '08123',
      is_admin: false,
      user_roles: [{ role_id: 'role-old' }],
      divisions: [{ division_id: 'div-old' }],
    });
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.update.mockResolvedValue({
      id: 'user-1',
      fullname: 'User Updated',
      email: 'user@example.com',
      phone: '081234567890',
      is_admin: false,
    });
    prismaMock.log.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.updateUser(
      'user-1',
      {
        fullname: 'User Updated',
        email: 'user@example.com',
        password: 'secret123',
        phone: '081234567890',
        is_admin: false,
        divisions: ['div-1'],
        roles: ['role-1'],
      },
      'Super Admin',
      'admin-1',
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        fullname: 'User Updated',
        email: 'user@example.com',
        phone: '081234567890',
        is_admin: false,
        password: 'hashed',
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        phone: true,
        is_admin: true,
      },
    });
    expect(prismaMock.userRole.deleteMany).toHaveBeenCalledWith({
      where: { user_id: 'user-1' },
    });
    expect(prismaMock.userRole.createMany).toHaveBeenCalledWith({
      data: [{ user_id: 'user-1', role_id: 'role-1' }],
    });
    expect(prismaMock.userDivision.deleteMany).toHaveBeenCalledWith({
      where: { user_id: 'user-1' },
    });
    expect(prismaMock.userDivision.createMany).toHaveBeenCalledWith({
      data: [{ user_id: 'user-1', division_id: 'div-1' }],
    });
    expect(prismaMock.log.create).toHaveBeenCalledWith({
      data: {
        action: 'UPDATE',
        reference_id: 'user-1',
        reference_type: 'USER',
        user_id: 'admin-1',
        description: 'Super Admin updated user User One (user1@example.com)',
        details: expect.any(String),
      },
    });
    expect(result).toEqual({
      id: 'user-1',
      fullname: 'User Updated',
      email: 'user@example.com',
      phone: '081234567890',
      is_admin: false,
    });
  });
});
