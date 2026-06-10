import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserGuard } from '../common/guards/user.guard';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  const paymentsServiceMock = {
    listPayments: vi.fn(),
    getPayment: vi.fn(),
    createPayment: vi.fn(),
    updatePayment: vi.fn(),
    deletePayment: vi.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: paymentsServiceMock }],
    });

    const module: TestingModule = await moduleBuilder
      .overrideGuard(UserGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns payments list response', async () => {
    paymentsServiceMock.listPayments.mockResolvedValue({
      items: [{ id: 'pay-1' }],
      total_pages: 2,
      current_page: 1,
    });

    const result = await controller.listPayments({
      payment_status: 'UNPAID',
      page: '1',
      limit: '10',
    });

    expect(paymentsServiceMock.listPayments).toHaveBeenCalledWith({
      payment_status: 'UNPAID',
      page: '1',
      limit: '10',
    });
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: {
        items: [{ id: 'pay-1' }],
        total_pages: 2,
        current_page: 1,
      },
    });
  });

  it('returns payment detail response', async () => {
    paymentsServiceMock.getPayment.mockResolvedValue({ id: 'pay-1' });

    const result = await controller.getPayment('pay-1');

    expect(paymentsServiceMock.getPayment).toHaveBeenCalledWith('pay-1');
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'pay-1' },
    });
  });

  it('returns create payment response', async () => {
    paymentsServiceMock.createPayment.mockResolvedValue({ id: 'pay-1' });

    const result = await controller.createPayment(
      { remarks: 'First installment' } as any,
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(paymentsServiceMock.createPayment).toHaveBeenCalledWith(
      { remarks: 'First installment' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.CREATED,
      data: { id: 'pay-1' },
    });
  });

  it('returns update payment response', async () => {
    paymentsServiceMock.updatePayment.mockResolvedValue({ id: 'pay-1' });

    const result = await controller.updatePayment(
      'pay-1',
      { remarks: 'Updated payment' } as any,
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(paymentsServiceMock.updatePayment).toHaveBeenCalledWith(
      'pay-1',
      { remarks: 'Updated payment' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'pay-1' },
    });
  });

  it('returns delete payment response', async () => {
    paymentsServiceMock.deletePayment.mockResolvedValue({ id: 'pay-1' });

    const result = await controller.deletePayment('pay-1', {
      credentials: { fullname: 'Super Admin', id: 'admin-1' },
    } as any);

    expect(paymentsServiceMock.deletePayment).toHaveBeenCalledWith(
      'pay-1',
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'pay-1' },
    });
  });
});
