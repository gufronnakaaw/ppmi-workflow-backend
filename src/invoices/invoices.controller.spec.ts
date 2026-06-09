import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserGuard } from '../common/guards/user.guard';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

describe('InvoicesController', () => {
  let controller: InvoicesController;
  const invoicesServiceMock = {
    listInvoices: vi.fn(),
    getInvoice: vi.fn(),
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [{ provide: InvoicesService, useValue: invoicesServiceMock }],
    });

    const module: TestingModule = await moduleBuilder
      .overrideGuard(UserGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<InvoicesController>(InvoicesController);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns invoices list response', async () => {
    invoicesServiceMock.listInvoices.mockResolvedValue({
      items: [{ id: 'inv-1' }],
      total_pages: 2,
      current_page: 1,
    });

    const result = await controller.listInvoices({
      status: 'DRAFT',
      page: '1',
      limit: '10',
    });

    expect(invoicesServiceMock.listInvoices).toHaveBeenCalledWith({
      status: 'DRAFT',
      page: '1',
      limit: '10',
    });
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: {
        items: [{ id: 'inv-1' }],
        total_pages: 2,
        current_page: 1,
      },
    });
  });

  it('returns invoice detail response', async () => {
    invoicesServiceMock.getInvoice.mockResolvedValue({ id: 'inv-1' });

    const result = await controller.getInvoice('inv-1');

    expect(invoicesServiceMock.getInvoice).toHaveBeenCalledWith('inv-1');
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'inv-1' },
    });
  });

  it('returns create invoice response', async () => {
    invoicesServiceMock.createInvoice.mockResolvedValue({ id: 'inv-1' });

    const result = await controller.createInvoice(
      { insured: 'PT. Alpha' } as any,
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(invoicesServiceMock.createInvoice).toHaveBeenCalledWith(
      { insured: 'PT. Alpha' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.CREATED,
      data: { id: 'inv-1' },
    });
  });

  it('returns update invoice response', async () => {
    invoicesServiceMock.updateInvoice.mockResolvedValue({ id: 'inv-1' });

    const result = await controller.updateInvoice(
      'inv-1',
      { insured: 'PT. Beta' } as any,
      { credentials: { fullname: 'Super Admin', id: 'admin-1' } } as any,
    );

    expect(invoicesServiceMock.updateInvoice).toHaveBeenCalledWith(
      'inv-1',
      { insured: 'PT. Beta' },
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'inv-1' },
    });
  });

  it('returns delete invoice response', async () => {
    invoicesServiceMock.deleteInvoice.mockResolvedValue({ id: 'inv-1' });

    const result = await controller.deleteInvoice('inv-1', {
      credentials: { fullname: 'Super Admin', id: 'admin-1' },
    } as any);

    expect(invoicesServiceMock.deleteInvoice).toHaveBeenCalledWith(
      'inv-1',
      'Super Admin',
      'admin-1',
    );
    expect(result).toEqual({
      success: true,
      status_code: HttpStatus.OK,
      data: { id: 'inv-1' },
    });
  });
});
