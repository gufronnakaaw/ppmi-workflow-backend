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
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AppService } from './app.service';
import {
  CreateDivisionDto,
  CreateRoleDto,
  UpdateDivisionDto,
  UpdateRoleDto,
  UpdateUserDto,
  createDivisionSchema,
  createRoleSchema,
  updateDivisionSchema,
  updateRoleSchema,
  updateUserSchema,
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
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

  @ApiBearerAuth()
  @Post('divisions')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createDivisionSchema))
  async createDivision(
    @Body() body: CreateDivisionDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.CREATED,
      data: await this.appService.createDivision(
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }

  @ApiBearerAuth()
  @Patch('divisions/:id')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateDivisionSchema))
  async updateDivision(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateDivisionDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.updateDivision(
        id,
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }

  @ApiBearerAuth()
  @Get('roles')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  async listRoles(): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.listRoles(),
    };
  }

  @ApiBearerAuth()
  @Get('roles/:id')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  async getRole(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.getRole(id),
    };
  }

  @ApiBearerAuth()
  @Post('roles')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(createRoleSchema))
  async createRole(
    @Body() body: CreateRoleDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.CREATED,
      data: await this.appService.createRole(
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }

  @ApiBearerAuth()
  @Patch('roles/:id')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateRoleSchema))
  async updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateRoleDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.updateRole(
        id,
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }

  @ApiBearerAuth()
  @Get('users')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  async listUsers(
    @Query() query: { division: string },
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.listUsers(query.division),
    };
  }

  @ApiBearerAuth()
  @Get('users/:id')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  async getUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.getUser(id),
    };
  }

  @ApiBearerAuth()
  @Patch('users/:id')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(updateUserSchema))
  async updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.OK,
      data: await this.appService.updateUser(
        id,
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }
}
