import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../common/services/prisma.service';
import { hashPassword, verifyPassword } from '../utils/bcrypt.util';
import { AuthService } from './auth.service';

vi.mock('../utils/bcrypt.util', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  const jwtMock = {
    signAsync: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('logs in with valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullname: 'Bp. Azhar',
      email: 'azhar@example.com',
      password: 'hashed',
      is_admin: false,
      division: { name: 'P&I' },
      user_roles: [{ role: { name: 'Editor' } }],
    });
    vi.mocked(verifyPassword).mockResolvedValue(true);
    jwtMock.signAsync.mockResolvedValue('token');

    const result = await service.login({
      email: 'azhar@example.com',
      password: 'secret123',
    });

    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      id: 'user-1',
      is_admin: false,
      fullname: 'Bp. Azhar',
      roles: ['Editor'],
    });
    expect(result).toEqual({
      id: 'user-1',
      fullname: 'Bp. Azhar',
      email: 'azhar@example.com',
      is_admin: false,
      division: 'P&I',
      roles: ['Editor'],
      access_token: 'token',
    });
  });

  it('rejects login when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'secret123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects login when password invalid', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      fullname: 'Bp. Azhar',
      email: 'azhar@example.com',
      password: 'hashed',
      is_admin: false,
      division: { name: 'P&I' },
      user_roles: [{ role: { name: 'Editor' } }],
    });
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(
      service.login({ email: 'azhar@example.com', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('registers user with roles when not admin', async () => {
    vi.mocked(hashPassword).mockResolvedValue('hashed');
    prismaMock.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'azhar@example.com',
    });

    const result = await service.register(
      {
        fullname: 'Bp. Azhar',
        email: 'azhar@example.com',
        password: 'secret123',
        division_id: '11111111-1111-1111-1111-111111111111',
        roles: ['22222222-2222-2222-2222-222222222222'],
      },
      'Super Admin',
    );

    expect(prismaMock.user.create).toHaveBeenCalled();
    const createArg = prismaMock.user.create.mock.calls[0][0];
    expect(createArg.data.created_by).toBe('Super Admin');
    expect(createArg.data.updated_by).toBe('Super Admin');
    expect(createArg.data.user_roles.createMany.data).toEqual([
      {
        role_id: '22222222-2222-2222-2222-222222222222',
        created_by: 'Super Admin',
        updated_by: 'Super Admin',
        division_id: '11111111-1111-1111-1111-111111111111',
      },
    ]);
    expect(result).toEqual({ id: 'user-1', email: 'azhar@example.com' });
  });

  it('registers admin without role links', async () => {
    vi.mocked(hashPassword).mockResolvedValue('hashed');
    prismaMock.user.create.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
    });

    await service.register(
      {
        fullname: 'Super Admin',
        email: 'admin@example.com',
        password: 'secret123',
        is_admin: true,
      },
      'Root Admin',
    );

    const createArg = prismaMock.user.create.mock.calls[0][0];
    expect(createArg.data.is_admin).toBe(true);
    expect(createArg.data.created_by).toBe('Root Admin');
    expect(createArg.data.updated_by).toBe('Root Admin');
    expect(createArg.data.user_roles).toBeUndefined();
  });
});
