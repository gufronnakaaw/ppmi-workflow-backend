import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ZodType } from 'zod';

@Injectable()
export class InputInterceptor implements NestInterceptor {
  constructor(private schema: ZodType<any>) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    this.schema.parse(request.body);
    return next.handle();
  }
}
