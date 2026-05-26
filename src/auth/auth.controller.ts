import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthMetaData } from '../common/decorators/auth.decorator';
import { UserGuard } from '../common/guards/user.guard';
import { ZodValidationPipe } from '../common/pipes/zod.pipe';
import { SuccessResponse } from '../common/types/global.type';
import { AuthService } from './auth.service';
import {
  LoginDto,
  loginSchema,
  RegisterDto,
  registerSchema,
} from './auth.validation';

@Controller('auth')
@UseGuards(UserGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @AuthMetaData('SkipAuth')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() body: LoginDto): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.CREATED,
      data: await this.authService.login(body),
    };
  }

  @ApiBearerAuth()
  @Post('register')
  @AuthMetaData('AdminOnly')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() body: RegisterDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    return {
      success: true,
      status_code: HttpStatus.CREATED,
      data: await this.authService.register(
        body,
        req.credentials.fullname,
        req.credentials.id,
      ),
    };
  }
}
