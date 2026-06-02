import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { QsController } from './qs.controller';
import { QsService } from './qs.service';

@Module({
  controllers: [QsController],
  providers: [QsService, PrismaService],
})
export class QsModule {}
