import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserGuard } from '../common/guards/user.guard';
import { QsController } from './qs.controller';
import { QsService } from './qs.service';

describe('QsController', () => {
  let controller: QsController;
  const qsServiceMock = {
    listQs: vi.fn(),
    getQs: vi.fn(),
    createQs: vi.fn(),
    updateQs: vi.fn(),
    deleteQs: vi.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [QsController],
      providers: [{ provide: QsService, useValue: qsServiceMock }],
    });

    const module: TestingModule = await moduleBuilder
      .overrideGuard(UserGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<QsController>(QsController);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns qs list response', async () => {
    qsServiceMock.listQs.mockResolvedValue({
      items: [{ id: 'qs-1' }],
      total_pages: 2,
      current_page: 1,
    });

    const result = await controller.listQs({
      status: 'DRAFT',
      page: '1',
      limit: '10',
    });

    expect(qsServiceMock.listQs).toHaveBeenCalledWith({
      status: 'DRAFT',
      page: '1',
      limit: '10',
    });
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: {
        items: [{ id: 'qs-1' }],
        total_pages: 2,
        current_page: 1,
      },
    });
  });

  it('returns qs detail response', async () => {
    qsServiceMock.getQs.mockResolvedValue({ id: 'qs-1' });

    const result = await controller.getQs('qs-1');

    expect(qsServiceMock.getQs).toHaveBeenCalledWith('qs-1');
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'qs-1' },
    });
  });

  it('returns create qs response', async () => {
    qsServiceMock.createQs.mockResolvedValue({ id: 'qs-1' });

    const result = await controller.createQs(
      { insured: 'PT. Alpha' } as any,
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(qsServiceMock.createQs).toHaveBeenCalledWith(
      { insured: 'PT. Alpha' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.CREATED,
      data: { id: 'qs-1' },
    });
  });

  it('returns update qs response', async () => {
    qsServiceMock.updateQs.mockResolvedValue({ id: 'qs-1' });

    const result = await controller.updateQs(
      'qs-1',
      { vessel: 'Sea Star' } as any,
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(qsServiceMock.updateQs).toHaveBeenCalledWith(
      'qs-1',
      { vessel: 'Sea Star' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'qs-1' },
    });
  });

  it('returns delete qs response', async () => {
    qsServiceMock.deleteQs.mockResolvedValue({ id: 'qs-1' });

    const result = await controller.deleteQs('qs-1', {
      credentials: { fullname: 'Super Admin', id: 'admin-1' },
    } as any);

    expect(qsServiceMock.deleteQs).toHaveBeenCalledWith(
      'qs-1',
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'qs-1' },
    });
  });
});
