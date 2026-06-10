import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserGuard } from '../common/guards/user.guard';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';

describe('VouchersController', () => {
  let controller: VouchersController;
  const vouchersServiceMock = {
    listVouchers: vi.fn(),
    getVoucher: vi.fn(),
    createVoucher: vi.fn(),
    updateVoucher: vi.fn(),
    deleteVoucher: vi.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [VouchersController],
      providers: [{ provide: VouchersService, useValue: vouchersServiceMock }],
    });

    const module: TestingModule = await moduleBuilder
      .overrideGuard(UserGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<VouchersController>(VouchersController);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns vouchers list response', async () => {
    vouchersServiceMock.listVouchers.mockResolvedValue({
      items: [{ id: 'vch-1' }],
      total_pages: 2,
      current_page: 1,
    });

    const result = await controller.listVouchers({
      status: 'DRAFT',
      page: '1',
      limit: '10',
    });

    expect(vouchersServiceMock.listVouchers).toHaveBeenCalledWith({
      status: 'DRAFT',
      page: '1',
      limit: '10',
    });
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: {
        items: [{ id: 'vch-1' }],
        total_pages: 2,
        current_page: 1,
      },
    });
  });

  it('returns voucher detail response', async () => {
    vouchersServiceMock.getVoucher.mockResolvedValue({ id: 'vch-1' });

    const result = await controller.getVoucher('vch-1');

    expect(vouchersServiceMock.getVoucher).toHaveBeenCalledWith('vch-1');
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'vch-1' },
    });
  });

  it('returns create voucher response', async () => {
    vouchersServiceMock.createVoucher.mockResolvedValue({ id: 'vch-1' });

    const result = await controller.createVoucher(
      { remarks: 'Initial voucher' } as any,
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(vouchersServiceMock.createVoucher).toHaveBeenCalledWith(
      { remarks: 'Initial voucher' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.CREATED,
      data: { id: 'vch-1' },
    });
  });

  it('returns update voucher response', async () => {
    vouchersServiceMock.updateVoucher.mockResolvedValue({ id: 'vch-1' });

    const result = await controller.updateVoucher(
      'vch-1',
      { remarks: 'Updated voucher' } as any,
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(vouchersServiceMock.updateVoucher).toHaveBeenCalledWith(
      'vch-1',
      { remarks: 'Updated voucher' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'vch-1' },
    });
  });

  it('returns delete voucher response', async () => {
    vouchersServiceMock.deleteVoucher.mockResolvedValue({ id: 'vch-1' });

    const result = await controller.deleteVoucher('vch-1', {
      credentials: { fullname: 'Super Admin', id: 'admin-1' },
    } as any);

    expect(vouchersServiceMock.deleteVoucher).toHaveBeenCalledWith(
      'vch-1',
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'vch-1' },
    });
  });
});
