import {BadRequestException,Injectable,NotFoundException,} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SELECT_USER = {
  id: true,
  fullName: true,
  email: true,
  position: true,
  role: true,
  status: true,
  hire_date: true,
  address: true,
  photo: true,
  created_at: true,
  updated_at: true,
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  private generatePassword(length = 12): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const symbols = '!@#$%^&*()-_=+[]{}';
    const all = upper + lower + digits + symbols;

    
    const password =
      upper[Math.floor(Math.random() * upper.length)] +
      lower[Math.floor(Math.random() * lower.length)] +
      digits[Math.floor(Math.random() * digits.length)] +
      symbols[Math.floor(Math.random() * symbols.length)] +
      Array.from({ length: length - 4 }, () =>
        all[Math.floor(Math.random() * all.length)],
      ).join('');

    
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  private buildPagination(page?: number, limit?: number) {
    const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
  }

  private buildWhere(search?: string, status?: string, role?: string) {
    const q = search?.trim();
    const normalizedStatus = status?.toUpperCase();
    const normalizedRole = role?.toUpperCase();
    const where: any = {};

    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { position: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (normalizedStatus && ['ACTIVE', 'INACTIVE', 'FREEZE'].includes(normalizedStatus)) {
      where.status = normalizedStatus;
    }

    if (normalizedRole && ['SUPERADMIN', 'ADMIN', 'MANAGEMENT', 'ADMINSTRATOR', 'TEACHER', 'STUDENT'].includes(normalizedRole)) {
      where.role = normalizedRole;
    }

    return where;
  }

  async register(dto: RegisterUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('Bu email allaqachon ro\'yxatdan o\'tgan');
    }

    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        position: dto.position,
        hire_date: new Date(dto.hire_date),
        role: dto.role,
        address: dto.address,
        password: hashedPassword,
      },
      select: SELECT_USER,
    });

    await this.mail.sendCredentials(dto.email, dto.fullName, plainPassword);

    return {
      message: `Ro'yxatdan o'tish muvaffaqiyatli. Login va parol ${dto.email} manziliga yuborildi.`,
      user,
    };
  }

  async findAll(params?: { page?: number; limit?: number; search?: string; status?: string; role?: string }) {
    const { page, limit, search, status, role } = params || {};
    const usePagination = page !== undefined || limit !== undefined || !!search || !!status || !!role;
    const where = this.buildWhere(search, status, role);

    if (!usePagination) {
      return this.prisma.user.findMany({
        select: SELECT_USER,
        orderBy: { created_at: 'desc' },
      });
    }

    const { page: safePage, limit: safeLimit, skip } = this.buildPagination(page, limit);
    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: safeLimit,
        select: SELECT_USER,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      },
    };
  }

  async getSummary() {
    const [total, active, inactive, freeze, superadmin, admin, management, administrator, teacher, student] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'INACTIVE' } }),
      this.prisma.user.count({ where: { status: 'FREEZE' } }),
      this.prisma.user.count({ where: { role: 'SUPERADMIN' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'MANAGEMENT' } }),
      this.prisma.user.count({ where: { role: 'ADMINSTRATOR' } }),
      this.prisma.user.count({ where: { role: 'TEACHER' } }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
    ]);

    return {
      total,
      byStatus: {
        ACTIVE: active,
        INACTIVE: inactive,
        FREEZE: freeze,
      },
      byRole: {
        SUPERADMIN: superadmin,
        ADMIN: admin,
        MANAGEMENT: management,
        ADMINSTRATOR: administrator,
        TEACHER: teacher,
        STUDENT: student,
      },
    };
  }

  async getSearchSummary(params?: { search?: string; status?: string; role?: string; page?: number; limit?: number }) {
    const where = this.buildWhere(params?.search, params?.status, params?.role);
    const { page, limit, skip } = this.buildPagination(params?.page, params?.limit);

    const [total, active, inactive, freeze, superadmin, admin, management, administrator, teacher, student, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { ...where, status: 'INACTIVE' } }),
      this.prisma.user.count({ where: { ...where, status: 'FREEZE' } }),
      this.prisma.user.count({ where: { ...where, role: 'SUPERADMIN' } }),
      this.prisma.user.count({ where: { ...where, role: 'ADMIN' } }),
      this.prisma.user.count({ where: { ...where, role: 'MANAGEMENT' } }),
      this.prisma.user.count({ where: { ...where, role: 'ADMINSTRATOR' } }),
      this.prisma.user.count({ where: { ...where, role: 'TEACHER' } }),
      this.prisma.user.count({ where: { ...where, role: 'STUDENT' } }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: SELECT_USER,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      summary: {
        query: params?.search?.trim() || '',
        total,
        byStatus: {
          ACTIVE: active,
          INACTIVE: inactive,
          FREEZE: freeze,
        },
        byRole: {
          SUPERADMIN: superadmin,
          ADMIN: admin,
          MANAGEMENT: management,
          ADMINSTRATOR: administrator,
          TEACHER: teacher,
          STUDENT: student,
        },
      },
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SELECT_USER,
    });

    if (!user) {
      throw new NotFoundException(`ID: ${id} bo'yicha foydalanuvchi topilmadi`);
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.hire_date) {
      data.hire_date = new Date(dto.hire_date);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: SELECT_USER,
    });

    return { message: 'Foydalanuvchi ma\'lumotlari yangilandi', user };
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return { message: `Foydalanuvchi (ID: ${id}) o'chirildi` };
  }

  async updatePhoto(id: number, filename: string) {
    await this.findOne(id);
    const Url = process.env.APP_URL ?? 'http://localhost:4000'
    const user = await this.prisma.user.update({
      where: { id },
      data: { photo: `${Url}/uploads/${filename}` },
      select: { id: true, fullName: true, photo: true },
    });

    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    return {
      message: 'Rasm muvaffaqiyatli yuklandi',
      photo: `${baseUrl}/uploads/${filename}`,
      user,
    };
  }
}
