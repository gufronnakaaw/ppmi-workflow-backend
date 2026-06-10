import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { UserGuard } from '../common/guards/user.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { SuccessResponse } from '../common/types/global.type';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  createPaymentSchema,
  updatePaymentSchema,
} from './payments.validation';

@Controller('payments')
@UseGuards(UserGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'voucher_id', required: false, type: String })
  @ApiQuery({ name: 'payment_status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'sort_by', required: false, type: String })
  @ApiQuery({ name: 'sort_order', required: false, type: String })
  async listPayments(
    @Query()
    query: {
      voucher_id?: string;
      payment_status?: string;
      search?: string;
      page?: string;
      limit?: string;
      sort_by?: string;
      sort_order?: string;
    },
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.paymentsService.listPayments(query),
    };
  }

  @ApiBearerAuth()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String })
  async getPayment(@Param('id') id: string): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.paymentsService.getPayment(id),
    };
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createPaymentSchema))
  async createPayment(
    @Body() body: CreatePaymentDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.CREATED,
      data: await this.paymentsService.createPayment(
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }

  @ApiBearerAuth()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updatePaymentSchema))
  @ApiParam({ name: 'id', type: String })
  async updatePayment(
    @Param('id') id: string,
    @Body() body: UpdatePaymentDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.paymentsService.updatePayment(
        id,
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String })
  async deletePayment(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.paymentsService.deletePayment(
        id,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }
}
