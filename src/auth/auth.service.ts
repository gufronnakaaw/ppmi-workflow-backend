import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/services/prisma.service';
import { hashPassword, verifyPassword } from '../utils/bcrypt.util';
import { LoginInput, RegisterInput } from './auth.validation';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(body: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        fullname: true,
        email: true,
        password: true,
        is_admin: true,
        division: {
          select: {
            name: true,
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

    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      is_admin: user.is_admin,
      division: user.is_admin ? null : user.division.name,
      roles: roles.length ? roles : null,
      access_token: await this.jwtService.signAsync({
        id: user.id,
        is_admin: user.is_admin,
        fullname: user.fullname,
        division: user.is_admin ? null : user.division.name,
        roles: roles.length ? roles : null,
      }),
    };
  }

  async register(body: RegisterInput, fullname: string) {
    const user = await this.prisma.user.create({
      data: {
        fullname: body.fullname,
        email: body.email,
        password: await hashPassword(body.password),
        phone: body.phone,
        is_admin: body.is_admin,
        division_id: body.division_id,
        created_by: fullname,
        updated_by: fullname,
        ...(!body.is_admin
          ? {
              user_roles: {
                createMany: {
                  data: body.roles?.map((role_id) => ({
                    role_id,
                    created_by: fullname,
                    updated_by: fullname,
                    division_id: body.division_id,
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
    });
    return user;
  }
}
