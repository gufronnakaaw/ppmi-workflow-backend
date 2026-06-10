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
import { VouchersService } from './vouchers.service';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
  createVoucherSchema,
  updateVoucherSchema,
} from './vouchers.validation';

@Controller('vouchers')
@UseGuards(UserGuard)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @ApiBearerAuth()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'payment_type', required: false, type: String })
  @ApiQuery({ name: 'bank_id', required: false, type: String })
  @ApiQuery({ name: 'invoice_id', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'sort_by', required: false, type: String })
  @ApiQuery({ name: 'sort_order', required: false, type: String })
  async listVouchers(
    @Query()
    query: {
      status?: string;
      payment_type?: string;
      bank_id?: string;
      invoice_id?: string;
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
      data: await this.vouchersService.listVouchers(query),
    };
  }

  @ApiBearerAuth()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String })
  async getVoucher(@Param('id') id: string): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.vouchersService.getVoucher(id),
    };
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createVoucherSchema))
  async createVoucher(
    @Body() body: CreateVoucherDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.CREATED,
      data: await this.vouchersService.createVoucher(
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }

  @ApiBearerAuth()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateVoucherSchema))
  @ApiParam({ name: 'id', type: String })
  async updateVoucher(
    @Param('id') id: string,
    @Body() body: UpdateVoucherDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.vouchersService.updateVoucher(
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
  async deleteVoucher(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.vouchersService.deleteVoucher(
        id,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }
}
