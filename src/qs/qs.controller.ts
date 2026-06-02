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
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { UserGuard } from '../common/guards/user.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { SuccessResponse } from '../common/types/global.type';
import { QsService } from './qs.service';
import {
  CreateQsDto,
  UpdateQsDto,
  createQsSchema,
  updateQsSchema,
} from './qs.validation';

@Controller('qs')
@UseGuards(UserGuard)
export class QsController {
  constructor(private readonly qsService: QsService) {}

  @ApiBearerAuth()
  @Get()
  @HttpCode(HttpStatus.OK)
  async listQs(
    @Query()
    query: {
      status?: string;
      division?: string;
      type?: string;
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
      data: await this.qsService.listQs(query),
    };
  }

  @ApiBearerAuth()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getQs(@Param('id') id: string): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.qsService.getQs(id),
    };
  }

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createQsSchema))
  async createQs(
    @Body() body: CreateQsDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.CREATED,
      data: await this.qsService.createQs(
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }

  @ApiBearerAuth()
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateQsSchema))
  async updateQs(
    @Param('id') id: string,
    @Body() body: UpdateQsDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.qsService.updateQs(
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
  async deleteQs(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.qsService.deleteQs(
        id,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }
}
