import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserGuard } from './common/guards/user.guard';

describe('AppController', () => {
  let controller: AppController;
  const appServiceMock = {
    listDivisions: vi.fn(),
    getDivision: vi.fn(),
    createDivision: vi.fn(),
    updateDivision: vi.fn(),
    listRoles: vi.fn(),
    getRole: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    listUsers: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appServiceMock }],
    });

    const module: TestingModule = await moduleBuilder
      .overrideGuard(UserGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<AppController>(AppController);
    vi.clearAllMocks();
  });

  it('returns index response', () => {
    const result = controller.index();

    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      message: 'PPMI Workflow Dev API',
    });
  });

  it('returns division list response', async () => {
    appServiceMock.listDivisions.mockResolvedValue([{ id: 'div-1' }]);

    const result = await controller.listDivisions();

    expect(appServiceMock.listDivisions).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: [{ id: 'div-1' }],
    });
  });

  it('returns division detail response', async () => {
    appServiceMock.getDivision.mockResolvedValue({ id: 'div-1' });

    const result = await controller.getDivision('div-1');

    expect(appServiceMock.getDivision).toHaveBeenCalledWith('div-1');
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'div-1' },
    });
  });

  it('returns create division response', async () => {
    appServiceMock.createDivision.mockResolvedValue({ id: 'div-1' });

    const result = await controller.createDivision({ name: 'P&I' }, {
      credentials: { fullname: 'Super Admin', id: 'admin-1' },
    } as any);

    expect(appServiceMock.createDivision).toHaveBeenCalledWith(
      { name: 'P&I' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.CREATED,
      data: { id: 'div-1' },
    });
  });

  it('returns update division response', async () => {
    appServiceMock.updateDivision.mockResolvedValue({ id: 'div-1' });

    const result = await controller.updateDivision(
      'div-1',
      { name: 'P&I Updated' },
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(appServiceMock.updateDivision).toHaveBeenCalledWith(
      'div-1',
      { name: 'P&I Updated' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'div-1' },
    });
  });

  it('returns role list response', async () => {
    appServiceMock.listRoles.mockResolvedValue([{ id: 'role-1' }]);

    const result = await controller.listRoles();

    expect(appServiceMock.listRoles).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: [{ id: 'role-1' }],
    });
  });

  it('returns role detail response', async () => {
    appServiceMock.getRole.mockResolvedValue({ id: 'role-1' });

    const result = await controller.getRole('role-1');

    expect(appServiceMock.getRole).toHaveBeenCalledWith('role-1');
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'role-1' },
    });
  });

  it('returns create role response', async () => {
    appServiceMock.createRole.mockResolvedValue({ id: 'role-1' });

    const result = await controller.createRole({ name: 'Editor' }, {
      credentials: { fullname: 'Super Admin', id: 'admin-1' },
    } as any);

    expect(appServiceMock.createRole).toHaveBeenCalledWith(
      { name: 'Editor' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.CREATED,
      data: { id: 'role-1' },
    });
  });

  it('returns update role response', async () => {
    appServiceMock.updateRole.mockResolvedValue({ id: 'role-1' });

    const result = await controller.updateRole(
      'role-1',
      { name: 'Editor Updated' },
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(appServiceMock.updateRole).toHaveBeenCalledWith(
      'role-1',
      { name: 'Editor Updated' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'role-1' },
    });
  });

  it('returns users list response', async () => {
    appServiceMock.listUsers.mockResolvedValue([{ id: 'user-1' }]);

    const result = await controller.listUsers({ division: 'P&I' });

    expect(appServiceMock.listUsers).toHaveBeenCalledWith('P&I');
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: [{ id: 'user-1' }],
    });
  });

  it('returns user detail response', async () => {
    appServiceMock.getUser.mockResolvedValue({ id: 'user-1' });

    const result = await controller.getUser('user-1');

    expect(appServiceMock.getUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'user-1' },
    });
  });

  it('returns update user response', async () => {
    appServiceMock.updateUser.mockResolvedValue({ id: 'user-1' });

    const result = await controller.updateUser(
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
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(appServiceMock.updateUser).toHaveBeenCalledWith(
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
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'user-1' },
    });
  });
});
