import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateDivisionInput,
  CreateRoleInput,
  UpdateDivisionInput,
  UpdateRoleInput,
} from './app.validation';
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
        name: body.name,
      },
    });

    if (duplicate) {
      throw new BadRequestException('Division name already exists');
    }

    const code = await this.generateDivisionCode();

    return this.prismaService.division.create({
      data: {
        code,
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

    if (body.name) {
      const duplicate = await this.prismaService.division.findFirst({
        where: {
          id: { not: id },
          name: body.name,
        },
      });

      if (duplicate) {
        throw new BadRequestException('Division name already exists');
      }
    }

    return this.prismaService.division.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        updated_by: fullname,
      },
    });
  }

  listRoles() {
    return this.prismaService.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  getRole(id: string) {
    return this.prismaService.role.findUnique({
      where: { id },
    });
  }

  async createRole(body: CreateRoleInput, fullname: string) {
    const duplicate = await this.prismaService.role.findFirst({
      where: {
        name: body.name,
      },
    });

    if (duplicate) {
      throw new BadRequestException('Role name already exists');
    }

    const code = await this.generateRoleCode();

    return this.prismaService.role.create({
      data: {
        code,
        name: body.name,
        description: body.description,
        created_by: fullname,
        updated_by: fullname,
      },
    });
  }

  async updateRole(id: string, body: UpdateRoleInput, fullname: string) {
    const existing = await this.prismaService.role.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    if (body.name) {
      const duplicate = await this.prismaService.role.findFirst({
        where: {
          id: { not: id },
          name: body.name,
        },
      });

      if (duplicate) {
        throw new BadRequestException('Role name already exists');
      }
    }

    return this.prismaService.role.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        updated_by: fullname,
      },
    });
  }

  private generateRandom4Digits(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  private async generateDivisionCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = `PPMID-${this.generateRandom4Digits()}`;
      const existing = await this.prismaService.division.findFirst({
        where: { code },
      });

      if (!existing) {
        return code;
      }
    }

    throw new InternalServerErrorException('Failed to generate division code');
  }

  private async generateRoleCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = `PPMIR-${this.generateRandom4Digits()}`;
      const existing = await this.prismaService.role.findFirst({
        where: { code },
      });

      if (!existing) {
        return code;
      }
    }

    throw new InternalServerErrorException('Failed to generate role code');
  }
}
