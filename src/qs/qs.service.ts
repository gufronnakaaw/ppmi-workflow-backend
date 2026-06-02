import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { Prisma, QSSTATUS, QSType } from '../generated/prisma/client';
import { CreateQsDto, UpdateQsDto } from './qs.validation';

@Injectable()
export class QsService {
  constructor(private readonly prismaService: PrismaService) {}

  private formatDateId(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  async listQs(filters: {
    status?: string | string[];
    division?: string | string[];
    type?: string | string[];
    search?: string | string[];
    page?: string | string[];
    limit?: string | string[];
    sort_by?: string | string[];
    sort_order?: string | string[];
  }) {
    const toSingleValue = (value?: string | string[]) => {
      if (!value) {
        return undefined;
      }

      if (Array.isArray(value)) {
        return value.map((item) => item.trim()).find(Boolean);
      }

      return value.trim();
    };

    const toDivisionNames = (value?: string | string[]) => {
      if (!value) {
        return [] as string[];
      }

      const rawValues = Array.isArray(value) ? value : [value];

      const names = rawValues
        .flatMap((item) => item.split(/[,|;]/))
        .map((name) => name.trim())
        .filter(Boolean);

      if (names.some((name) => name.toUpperCase() === 'ALL')) {
        return [] as string[];
      }

      return names;
    };

    const normalizeEnum = <T extends string>(
      value: string | string[] | undefined,
      allowed: readonly T[],
      label: string,
    ) => {
      const normalizedValues = (Array.isArray(value) ? value : [value])
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);

      if (normalizedValues.some((item) => item.toUpperCase() === 'ALL')) {
        return undefined;
      }

      const normalized = normalizedValues[0];

      if (!normalized) {
        return undefined;
      }

      const upper = normalized.toUpperCase();

      if (!allowed.includes(upper as T)) {
        throw new BadRequestException(`Invalid ${label}`);
      }

      return upper as T;
    };

    const AND: Prisma.QSWhereInput[] = [{ is_deleted: false }];

    const status = normalizeEnum(
      filters.status,
      Object.values(QSSTATUS),
      'status',
    );
    const type = normalizeEnum(filters.type, Object.values(QSType), 'type');
    const divisionNames = toDivisionNames(filters.division);
    const searchTerm = toSingleValue(filters.search);
    const pageRaw = toSingleValue(filters.page);
    const limitRaw = toSingleValue(filters.limit);
    const sortByRaw = toSingleValue(filters.sort_by);
    const sortOrderRaw = toSingleValue(filters.sort_order);

    const page = pageRaw ? Number(pageRaw) : 1;
    const limit = limitRaw ? Number(limitRaw) : 10;

    if (!Number.isFinite(page) || page < 1) {
      throw new BadRequestException('Invalid page');
    }

    if (!Number.isFinite(limit) || limit < 1) {
      throw new BadRequestException('Invalid limit');
    }

    const sortBy = (sortByRaw ?? 'created_at').toLowerCase();
    const sortOrder = (sortOrderRaw ?? 'desc').toLowerCase();

    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      throw new BadRequestException('Invalid sort_order');
    }

    const sortFieldMap: Record<
      string,
      keyof Prisma.QSOrderByWithRelationInput
    > = {
      qs_id: 'id',
      id: 'id',
      insured: 'insured',
      vessel: 'vessel',
      premium: 'premium_amount',
      premium_amount: 'premium_amount',
      created_at: 'created_at',
      updated_at: 'updated_at',
    };

    const sortField = sortFieldMap[sortBy];

    if (!sortField) {
      throw new BadRequestException('Invalid sort_by');
    }

    const orderBy: Prisma.QSOrderByWithRelationInput = {
      [sortField]: sortOrder,
    };

    if (status) {
      AND.push({ status });
    }

    if (type) {
      AND.push({ type });
    }

    if (divisionNames.length > 0) {
      AND.push({
        OR: divisionNames.map((name) => ({
          division: {
            is: {
              name: {
                equals: name,
                mode: 'insensitive',
              },
            },
          },
        })),
      });
    }

    if (searchTerm && searchTerm.length > 0) {
      AND.push({
        OR: [
          { id: { contains: searchTerm, mode: 'insensitive' } },
          { insured: { contains: searchTerm, mode: 'insensitive' } },
          { vessel: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    const [items, total] = await this.prismaService.$transaction([
      this.prismaService.qS.findMany({
        where: { AND },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          division: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prismaService.qS.count({ where: { AND } }),
    ]);

    return {
      items: items.map((item) => {
        const { division, ...rest } = item;
        return { ...rest, division: division?.name ?? null };
      }),
      total_pages: Math.ceil(total / limit),
      current_page: page,
    };
  }

  async getQs(id: string) {
    const qs = await this.prismaService.qS.findFirst({
      where: { id, is_deleted: false },
      include: {
        division: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!qs) {
      throw new NotFoundException('QS not found');
    }

    const { division, ...rest } = qs;
    return { ...rest, division: division?.name ?? null };
  }

  async createQs(body: CreateQsDto, fullname: string, user_id: string) {
    const duplicate = await this.prismaService.qS.findFirst({
      where: {
        division_id: body.division_id,
        policy_number: body.policy_number,
        is_deleted: false,
      },
    });

    if (duplicate) {
      throw new BadRequestException('Policy number already exists');
    }

    const datePart = this.formatDateId(new Date());
    const prefix = `QS-${datePart}-`;

    const qs = await this.prismaService.$transaction(async (prisma) => {
      const latest = await prisma.qS.findFirst({
        where: {
          id: {
            startsWith: prefix,
          },
        },
        orderBy: {
          id: 'desc',
        },
        select: {
          id: true,
        },
      });

      const lastSequence = latest?.id
        ? Number(latest.id.slice(prefix.length))
        : 0;
      const nextSequence =
        Number.isFinite(lastSequence) && lastSequence > 0
          ? lastSequence + 1
          : 1;
      const qsId = `${prefix}${String(nextSequence).padStart(3, '0')}`;

      const create = await prisma.qS.create({
        data: {
          id: qsId,
          division_id: body.division_id,
          type: body.type,
          status: body.status,
          insured: body.insured,
          vessel: body.vessel,
          insurance: body.insurance,
          member: body.member,
          leader: body.leader,
          policy_number: body.policy_number,
          period_from: body.period_from,
          period_to: body.period_to,
          premium_amount: body.premium_amount,
          currency: body.currency,
          remarks: body.remarks,
        },
      });

      await prisma.log.create({
        data: {
          action: 'CREATE',
          reference_id: create.id,
          reference_type: 'QS',
          user_id,
          description: `${fullname} created a new QS with policy number ${body.policy_number}`,
        },
      });

      return create;
    });

    return qs;
  }

  async updateQs(
    id: string,
    body: UpdateQsDto,
    fullname: string,
    user_id: string,
  ) {
    const existing = await this.prismaService.qS.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('QS not found');
    }

    const nextPolicyNumber = body.policy_number ?? existing.policy_number;
    const nextDivisionId = body.division_id ?? existing.division_id;

    if (
      (body.policy_number && body.policy_number !== existing.policy_number) ||
      (body.division_id && body.division_id !== existing.division_id)
    ) {
      const duplicate = await this.prismaService.qS.findFirst({
        where: {
          id: { not: id },
          division_id: nextDivisionId,
          policy_number: nextPolicyNumber,
          is_deleted: false,
        },
      });

      if (duplicate) {
        throw new BadRequestException('Policy number already exists');
      }
    }

    const qs = await this.prismaService.$transaction(async (prisma) => {
      const update = await prisma.qS.update({
        where: { id },
        data: {
          division_id: body.division_id,
          type: body.type,
          status: body.status,
          insured: body.insured,
          vessel: body.vessel,
          insurance: body.insurance,
          member: body.member,
          leader: body.leader,
          policy_number: body.policy_number,
          period_from: body.period_from,
          period_to: body.period_to,
          premium_amount: body.premium_amount,
          currency: body.currency,
          remarks: body.remarks,
        },
      });

      await prisma.log.create({
        data: {
          action: 'UPDATE',
          reference_id: id,
          reference_type: 'QS',
          user_id,
          description: `${fullname} updated QS policy number ${existing.policy_number}`,
          details: JSON.stringify({
            before: {
              division_id: existing.division_id,
              type: existing.type,
              status: existing.status,
              insured: existing.insured,
              vessel: existing.vessel,
              insurance: existing.insurance,
              member: existing.member,
              leader: existing.leader,
              policy_number: existing.policy_number,
              period_from: existing.period_from,
              period_to: existing.period_to,
              premium_amount: existing.premium_amount,
              currency: existing.currency,
              remarks: existing.remarks,
              is_deleted: existing.is_deleted,
            },
            after: {
              division_id: update.division_id,
              type: update.type,
              status: update.status,
              insured: update.insured,
              vessel: update.vessel,
              insurance: update.insurance,
              member: update.member,
              leader: update.leader,
              policy_number: update.policy_number,
              period_from: update.period_from,
              period_to: update.period_to,
              premium_amount: update.premium_amount,
              currency: update.currency,
              remarks: update.remarks,
              is_deleted: update.is_deleted,
            },
          }),
        },
      });

      return update;
    });

    return qs;
  }

  async deleteQs(id: string, fullname: string, user_id: string) {
    const existing = await this.prismaService.qS.findFirst({
      where: { id, is_deleted: false },
    });

    if (!existing) {
      throw new NotFoundException('QS not found');
    }

    const deletedAt = new Date();

    const qs = await this.prismaService.$transaction(async (prisma) => {
      const update = await prisma.qS.update({
        where: { id },
        data: {
          is_deleted: true,
          deleted_at: deletedAt,
        },
      });

      await prisma.log.create({
        data: {
          action: 'DELETE',
          reference_id: id,
          reference_type: 'QS',
          user_id,
          description: `${fullname} deleted QS ${existing.policy_number}`,
          details: JSON.stringify({
            before: {
              policy_number: existing.policy_number,
              is_deleted: existing.is_deleted,
              deleted_at: existing.deleted_at,
            },
            after: {
              is_deleted: true,
              deleted_at: deletedAt,
            },
          }),
        },
      });

      return update;
    });

    return qs;
  }
}
