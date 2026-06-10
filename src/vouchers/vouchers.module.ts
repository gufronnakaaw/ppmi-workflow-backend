import { Module } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';

@Module({
  controllers: [VouchersController],
  providers: [VouchersService, PrismaService],
})
export class VouchersModule {}
