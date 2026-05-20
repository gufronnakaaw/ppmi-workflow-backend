import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { SuccessResponse } from './common/types/global.type';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  index(): SuccessResponse {
    return {
      success: true,
      status_code: HttpStatus.OK,
      message: `PPMI Workflow ${process.env.MODE === 'production' ? 'API' : 'Dev API'}`,
    };
  }
}
