import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDivisionInput, UpdateDivisionInput } from './app.validation';
import { PrismaService } from './common/services/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}

  listDivisions() {
    return this.prismaService.division.findMany({
      orderBy: { name: 'asc' },
    });
  }

  getDivision(id: string) {
    return this.prismaService.division.findUnique({
      where: { id },
    });
  }

  async createDivision(body: CreateDivisionInput, fullname: string) {
    const duplicate = await this.prismaService.division.findFirst({
      where: {
        OR: [{ code: body.code }, { name: body.name }],
      },
    });

    if (duplicate) {
      throw new BadRequestException('Division code or name already exists');
    }

    return this.prismaService.division.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description,
        created_by: fullname,
        updated_by: fullname,
      },
    });
  }

  async updateDivision(
    id: string,
    body: UpdateDivisionInput,
    fullname: string,
  ) {
    const existing = await this.prismaService.division.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Division not found');
    }

    if (body.code || body.name) {
      const duplicate = await this.prismaService.division.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(body.code ? [{ code: body.code }] : []),
            ...(body.name ? [{ name: body.name }] : []),
          ],
        },
      });

      if (duplicate) {
        throw new BadRequestException('Division code or name already exists');
      }
    }

    return this.prismaService.division.update({
      where: { id },
      data: {
        code: body.code,
        name: body.name,
        description: body.description,
        updated_by: fullname,
      },
    });
  }
}
