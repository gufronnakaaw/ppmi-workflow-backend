import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { GlobalException } from './common/exceptions/global.exception';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));
  app.useGlobalFilters(new GlobalException(app.get(HttpAdapterHost)));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
