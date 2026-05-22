import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { AppService } from './app.service';
import {
  CreateDivisionInput,
  createDivisionSchema,
  UpdateDivisionInput,
  updateDivisionSchema,
} from './app.validation';
import { AuthMetaData } from './common/decorators/auth.decorator';
import { UserGuard } from './common/guards/user.guard';
import { ZodValidationPipe } from './common/pipes/zod.pipe';
import { SuccessResponse } from './common/types/global.type';

@Controller()
@UseGuards(UserGuard)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @AuthMetaData('SkipAuth')
  @HttpCode(HttpStatus.OK)
  index(): SuccessResponse {
    return {
      success: true,
      status_code: HttpStatus.OK,
      message: `PPMI Workflow ${process.env.MODE === 'production' ? 'API' : 'Dev API'}`,
    };
  }

  @Get('divisions')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  async listDivisions(): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.listDivisions(),
    };
  }

  @Get('divisions/:id')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  async getDivision(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.getDivision(id),
    };
  }

  @Post('divisions')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createDivisionSchema))
  async createDivision(
    @Body() body: CreateDivisionInput,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.CREATED,
      data: await this.appService.createDivision(
        body,
        req.credentials.fullname,
      ),
    };
  }

  @Patch('divisions/:id')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateDivisionSchema))
  async updateDivision(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateDivisionInput,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.updateDivision(
        id,
        body,
        req.credentials.fullname,
      ),
    };
  }
}
