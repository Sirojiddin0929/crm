import {BadRequestException,Injectable,NotFoundException, UnauthorizedException,} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { JwtService } from '@nestjs/jwt';

const SELECT_TEACHER = {
  id: true,
  fullName: true,
  email: true,
  photo: true,
  position: true,
  experience: true,
  status: true,
  created_at: true,
  updated_at: true
};

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private jwt:JwtService
  ) {}

  private buildPagination(page?: number, limit?: number) {
    const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
  }

  private buildWhere(search?: string, status?: string) {
    const q = search?.trim();
    const normalizedStatus = status?.toUpperCase();
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

    return where;
  }

  async create(dto: CreateTeacherDto) {
    const exists = await this.prisma.teacher.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('Bu email allaqachon ro\'yxatdan o\'tgan');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const teacher = await this.prisma.teacher.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        position: dto.position,
        experience: dto.experience,
        password: hashedPassword,
        
      },
      select: SELECT_TEACHER,
    });

    return {
      message: `O'qituvchi qo'shildi.`,
      teacher,
    };
  }

  async login (dto:LoginDto){
    const teacher = await this.prisma.teacher.findUnique({
      where:{email:dto.email}
    })

    if(!teacher){
      throw new UnauthorizedException("Email yoki password xato")
    }

    const isMatchTeacher = await bcrypt.compare(dto.password,teacher.password)
    if(!isMatchTeacher){
      throw new UnauthorizedException("Eamil yoki password xato")
    }

    const teacherToken = await this.jwt.signAsync({
      sub:teacher.id,
      email:teacher.email,
      role:'TEACHER',
      type:'teacher'
    })

    return {
      access_token: teacherToken,
      type:'teacher',
      user:{
        id:teacher.id,
        fullName:teacher.fullName,
        email:teacher.email,
        photo: teacher.photo,
        role:'TEACHER',
        status:teacher.status
      }
    }



  }

  async findAll(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const { page, limit, search, status } = params || {};
    const usePagination = page !== undefined || limit !== undefined || !!search || !!status;
    const where = this.buildWhere(search, status);

    if (!usePagination) {
      return this.prisma.teacher.findMany({
        select: SELECT_TEACHER,
        orderBy: { created_at: 'desc' },
      });
    }

    const { page: safePage, limit: safeLimit, skip } = this.buildPagination(page, limit);
    const [total, data] = await Promise.all([
      this.prisma.teacher.count({ where }),
      this.prisma.teacher.findMany({
        where,
        skip,
        take: safeLimit,
        select: SELECT_TEACHER,
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
    const [total, active, inactive, freeze, expAgg, totalGroups] = await Promise.all([
      this.prisma.teacher.count(),
      this.prisma.teacher.count({ where: { status: 'ACTIVE' } }),
      this.prisma.teacher.count({ where: { status: 'INACTIVE' } }),
      this.prisma.teacher.count({ where: { status: 'FREEZE' } }),
      this.prisma.teacher.aggregate({
        _avg: { experience: true },
      }),
      this.prisma.group.count(),
    ]);

    return {
      total,
      totalGroups,
      avgExperience: Number(expAgg._avg.experience || 0),
      byStatus: {
        ACTIVE: active,
        INACTIVE: inactive,
        FREEZE: freeze,
      },
    };
  }

  async getSearchSummary(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const where = this.buildWhere(params?.search, params?.status);
    const { page, limit, skip } = this.buildPagination(params?.page, params?.limit);

    const [total, active, inactive, freeze, items] = await Promise.all([
      this.prisma.teacher.count({ where }),
      this.prisma.teacher.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.teacher.count({ where: { ...where, status: 'INACTIVE' } }),
      this.prisma.teacher.count({ where: { ...where, status: 'FREEZE' } }),
      this.prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        select: SELECT_TEACHER,
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
      },
      data: items,
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
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      select: {
        ...SELECT_TEACHER,
        groups: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            startTime: true,
            weekDays: true,
            course: { select: { id: true, name: true } },
            room: { select: { id: true, name: true } },
          },
        },
        rating: {
          select: {
            id: true,
            score: true,
            created_at: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException(`ID: ${id} bo'yicha o'qituvchi topilmadi`);
    }

    const avgRating =
      teacher.rating.length > 0
        ? teacher.rating.reduce((sum, r) => sum + r.score, 0) /
          teacher.rating.length
        : null;

    return { ...teacher, avgRating };
  }

  async update(id: number, dto: UpdateTeacherDto) {
    await this.findOne(id);

    const teacher = await this.prisma.teacher.update({
      where: { id },
      data: dto,
      select: SELECT_TEACHER,
    });

    return { message: 'O\'qituvchi ma\'lumotlari yangilandi', teacher };
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.teacher.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return { message: `O'qituvchi (ID: ${id}) o'chirildi` };
  }

  async getGroups(id: number) {
    await this.findOne(id);

    return this.prisma.group.findMany({
      where: { teacherId: id },
      select: {
        id: true,
        name: true,
        status: true,
        capacity: true,
        startDate: true,
        startTime: true,
        weekDays: true,
        course: { select: { id: true, name: true, level: true } },
        room: { select: { id: true, name: true } },
        _count: { select: { studentGroup: true, lesson: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async updatePhoto(id: number, filename: string) {
    await this.findOne(id);
    const Url = process.env.APP_URL ?? 'http://localhost:4000';
    const teacher = await this.prisma.teacher.update({
      where: { id },
      data: { photo: `${Url}/uploads/${filename}` },
      select: { id: true, fullName: true, photo: true },
    });

    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    return {
      message: 'Rasm muvaffaqiyatli yuklandi',
      photo: `${baseUrl}/uploads/${filename}`,
      teacher,
    };
  }
}
