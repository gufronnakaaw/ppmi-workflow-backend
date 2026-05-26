import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateDivisionDto,
  CreateRoleDto,
  UpdateDivisionDto,
  UpdateRoleDto,
  UpdateUserDto,
} from './app.validation';
import { PrismaService } from './common/services/prisma.service';
import { hashPassword } from './utils/bcrypt.util';

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

  async createDivision(
    body: CreateDivisionDto,
    fullname: string,
    user_id: string,
  ) {
    const duplicate = await this.prismaService.division.findFirst({
      where: {
        name: body.name,
      },
    });

    if (duplicate) {
      throw new BadRequestException('Division name already exists');
    }

    const code = await this.generateDivisionCode();

    const division = await this.prismaService.$transaction(async (prisma) => {
      const create = await prisma.division.create({
        data: {
          code,
          name: body.name,
          description: body.description,
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      await prisma.log.create({
        data: {
          action: 'CREATE',
          reference_id: create.id,
          reference_type: 'DIVISION',
          user_id,
          description: `${fullname} created a new division with name ${body.name}`,
        },
      });
      return create;
    });

    return division;
  }

  async updateDivision(
    id: string,
    body: UpdateDivisionDto,
    fullname: string,
    user_id: string,
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

    const division = await this.prismaService.$transaction(async (prisma) => {
      const update = await prisma.division.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
        },
      });

      await prisma.log.create({
        data: {
          action: 'UPDATE',
          reference_id: id,
          reference_type: 'DIVISION',
          user_id,
          description: `${fullname} updated a ${body.name ? 'division name' : 'division description'} from ${body.name ? existing.name : existing.description} to ${body.name ? body.name : body.description}`,
          details: JSON.stringify({
            before: {
              name: existing.name,
              description: existing.description,
            },
            after: {
              name: update.name,
              description: update.description,
            },
          }),
        },
      });
      return update;
    });

    return division;
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

  async createRole(body: CreateRoleDto, fullname: string, user_id: string) {
    const duplicate = await this.prismaService.role.findFirst({
      where: {
        name: body.name,
      },
    });

    if (duplicate) {
      throw new BadRequestException('Role name already exists');
    }

    const code = await this.generateRoleCode();

    const role = await this.prismaService.$transaction(async (prisma) => {
      const create = await prisma.role.create({
        data: {
          code,
          name: body.name,
          description: body.description,
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      await prisma.log.create({
        data: {
          action: 'CREATE',
          reference_id: create.id,
          reference_type: 'ROLE',
          user_id,
          description: `${fullname} created a new role with name ${body.name}`,
        },
      });

      return create;
    });

    return role;
  }

  async updateRole(
    id: string,
    body: UpdateRoleDto,
    fullname: string,
    user_id: string,
  ) {
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

    const role = await this.prismaService.$transaction(async (prisma) => {
      const update = await prisma.role.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
        },
      });

      await prisma.log.create({
        data: {
          action: 'UPDATE',
          reference_id: id,
          reference_type: 'ROLE',
          user_id,
          description: `${fullname} updated a ${body.name ? 'role name' : 'role description'} from ${body.name ? existing.name : existing.description} to ${body.name ? body.name : body.description}`,
          details: JSON.stringify({
            before: {
              name: existing.name,
              description: existing.description,
            },
            after: {
              name: update.name,
              description: update.description,
            },
          }),
        },
      });

      return update;
    });

    return role;
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

  async listUsers(division: string) {
    const AND = [];

    if (!division) {
      AND.push({ is_admin: false });
    } else {
      AND.push({ division: { name: division } }, { is_admin: false });
    }

    const users = await this.prismaService.user.findMany({
      where: {
        AND,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        created_at: true,
        is_admin: true,
        divisions: {
          select: {
            division: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      created_at: user.created_at,
      is_admin: user.is_admin,
      divisions: user.divisions.map((d) => d.division.name),
    }));
  }

  async getUser(id: string) {
    return this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullname: true,
        email: true,
        created_at: true,
        is_admin: true,
      },
    });
  }

  async updateUser(
    id: string,
    body: UpdateUserDto,
    fullname: string,
    user_id: string,
  ) {
    const existing = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullname: true,
        email: true,
        phone: true,
        is_admin: true,
        user_roles: {
          select: {
            role_id: true,
          },
        },
        divisions: {
          select: {
            division_id: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (body.email && body.email !== existing.email) {
      const duplicate = await this.prismaService.user.findFirst({
        where: {
          id: { not: id },
          email: body.email,
        },
      });

      if (duplicate) {
        throw new BadRequestException('Email already exists');
      }
    }

    const beforeRoles = existing.user_roles.map((role) => role.role_id);
    const beforeDivisions = existing.divisions.map(
      (division) => division.division_id,
    );
    const nextIsAdmin = body.is_admin ?? existing.is_admin;
    const afterRoles = nextIsAdmin
      ? []
      : Array.isArray(body.roles)
        ? body.roles
        : beforeRoles;
    const afterDivisions = nextIsAdmin
      ? []
      : Array.isArray(body.divisions)
        ? body.divisions
        : beforeDivisions;

    const updatedUser = await this.prismaService.$transaction(
      async (prisma) => {
        const update = await prisma.user.update({
          where: { id },
          data: {
            fullname: body.fullname,
            email: body.email,
            phone: body.phone,
            is_admin: nextIsAdmin,
            password: await hashPassword(body.password),
          },
          select: {
            id: true,
            fullname: true,
            email: true,
            phone: true,
            is_admin: true,
          },
        });

        if (nextIsAdmin) {
          await prisma.userRole.deleteMany({
            where: { user_id: id },
          });
          await prisma.userDivision.deleteMany({
            where: { user_id: id },
          });
        } else {
          if (Array.isArray(body.roles)) {
            await prisma.userRole.deleteMany({
              where: { user_id: id },
            });

            if (body.roles.length > 0) {
              await prisma.userRole.createMany({
                data: body.roles.map((role_id) => ({
                  user_id: id,
                  role_id,
                })),
              });
            }
          }

          if (Array.isArray(body.divisions)) {
            await prisma.userDivision.deleteMany({
              where: { user_id: id },
            });

            if (body.divisions.length > 0) {
              await prisma.userDivision.createMany({
                data: body.divisions.map((division_id) => ({
                  user_id: id,
                  division_id,
                })),
              });
            }
          }
        }

        await prisma.log.create({
          data: {
            action: 'UPDATE',
            reference_id: id,
            reference_type: 'USER',
            user_id,
            description: `${fullname} updated user ${existing.fullname} (${existing.email})`,
            details: JSON.stringify({
              before: {
                fullname: existing.fullname,
                email: existing.email,
                phone: existing.phone,
                is_admin: existing.is_admin,
                roles: beforeRoles,
                divisions: beforeDivisions,
              },
              after: {
                fullname: body.fullname,
                email: body.email,
                phone: body.phone,
                is_admin: nextIsAdmin,
                roles: afterRoles,
                divisions: afterDivisions,
              },
            }),
          },
        });

        return update;
      },
    );

    return updatedUser;
  }
}
