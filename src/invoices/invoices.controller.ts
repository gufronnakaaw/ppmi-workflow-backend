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
import { InvoicesService } from './invoices.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  createInvoiceSchema,
  updateInvoiceSchema,
} from './invoices.validation';

@Controller('invoices')
@UseGuards(UserGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @ApiBearerAuth()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'qs_id', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'sort_by', required: false, type: String })
  @ApiQuery({ name: 'sort_order', required: false, type: String })
  async listInvoices(
    @Query()
    query: {
      status?: string;
      qs_id?: string;
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
      data: await this.invoicesService.listInvoices(query),
    };
  }

  @ApiBearerAuth()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String })
  async getInvoice(@Param('id') id: string): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.invoicesService.getInvoice(id),
    };
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createInvoiceSchema))
  async createInvoice(
    @Body() body: CreateInvoiceDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.CREATED,
      data: await this.invoicesService.createInvoice(
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }

  @ApiBearerAuth()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateInvoiceSchema))
  @ApiParam({ name: 'id', type: String })
  async updateInvoice(
    @Param('id') id: string,
    @Body() body: UpdateInvoiceDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.invoicesService.updateInvoice(
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
  async deleteInvoice(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.invoicesService.deleteInvoice(
        id,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }
}
