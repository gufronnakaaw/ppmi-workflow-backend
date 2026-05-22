import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserGuard } from '../common/guards/user.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    login: vi.fn(),
    register: vi.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    });

    const module: TestingModule = await moduleBuilder
      .overrideGuard(UserGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns login response', async () => {
    authServiceMock.login.mockResolvedValue({ access_token: 'token' });

    const result = await controller.login({
      email: 'azhar@example.com',
      password: 'secret123',
    });

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'azhar@example.com',
      password: 'secret123',
    });
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.CREATED,
      data: { access_token: 'token' },
    });
  });

  it('returns register response', async () => {
    authServiceMock.register.mockResolvedValue({ id: 'user-1' });

    const result = await controller.register(
      {
        fullname: 'Bp. Azhar',
        email: 'azhar@example.com',
        password: 'secret123',
      },
      { credentials: { fullname: 'Super Admin' } } as any,
    );

    expect(authServiceMock.register).toHaveBeenCalledWith(
      {
        fullname: 'Bp. Azhar',
        email: 'azhar@example.com',
        password: 'secret123',
      },
      'Super Admin',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.CREATED,
      data: { id: 'user-1' },
    });
  });
});
