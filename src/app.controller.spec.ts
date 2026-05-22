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

    const result = await controller.createDivision(
      { code: 'PI', name: 'P&I' },
      { credentials: { fullname: 'Super Admin' } } as any,
    );

    expect(appServiceMock.createDivision).toHaveBeenCalledWith(
      { code: 'PI', name: 'P&I' },
      'Super Admin',
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
      { credentials: { fullname: 'Super Admin' } } as any,
    );

    expect(appServiceMock.updateDivision).toHaveBeenCalledWith(
      'div-1',
      { name: 'P&I Updated' },
      'Super Admin',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'div-1' },
    });
  });
});
