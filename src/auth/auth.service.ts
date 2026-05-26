import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/services/prisma.service';
import { hashPassword, verifyPassword } from '../utils/bcrypt.util';
import { LoginDto, RegisterDto } from './auth.validation';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(body: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        fullname: true,
        email: true,
        password: true,
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
        user_roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!(await verifyPassword(body.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    await this.prisma.log.create({
      data: {
        action: 'LOGIN',
        reference_id: user.id,
        reference_type: 'USER',
        user_id: user.id,
        description: `${user.fullname} logged in`,
      },
    });

    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      is_admin: user.is_admin,
      divisions: user.is_admin
        ? null
        : user.divisions.map((d) => d.division.name),
      roles: roles.length ? roles : null,
      access_token: await this.jwtService.signAsync({
        id: user.id,
        is_admin: user.is_admin,
        fullname: user.fullname,
        divisions: user.is_admin
          ? null
          : user.divisions.map((d) => d.division.name),
        roles: roles.length ? roles : null,
      }),
    };
  }

  async register(body: RegisterDto, fullname: string, user_id: string) {
    const [user] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          fullname: body.fullname,
          email: body.email,
          password: await hashPassword(body.password),
          phone: body.phone,
          is_admin: body.is_admin,
          ...(!body.is_admin
            ? {
                user_roles: {
                  createMany: {
                    data: body.roles?.map((role_id) => ({
                      role_id,
                    })),
                  },
                },
              }
            : {}),
          ...(!body.is_admin
            ? {
                divisions: {
                  createMany: {
                    data: body.divisions?.map((division_id) => ({
                      division_id,
                    })),
                  },
                },
              }
            : {}),
        },
        select: {
          id: true,
          email: true,
        },
      }),
      this.prisma.log.create({
        data: {
          action: 'CREATE',
          description: `${fullname} created a new account with email ${body.email}`,
          user_id,
        },
      }),
    ]);
    return user;
  }
}
