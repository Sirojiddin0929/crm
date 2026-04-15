import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

const SELECT_RATING = {
  id: true,
  score: true,
  comment: true,
  studentId: true,
  created_at: true,
  student: { select: { id: true, fullName: true, email: true } },
  teacher: { select: { id: true, fullName: true } },
  lesson: { select: { id: true, title: true, date: true, group: { select: { id: true, name: true } } } },
};

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  private buildPagination(page?: number, limit?: number) {
    const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
  }

  async create(dto: CreateRatingDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: dto.teacherId } });
    if (!teacher) throw new NotFoundException("O'qituvchi topilmadi");

    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    // Agar studentId berilgan bo'lsa — upsert (bir marta baholash)
    if (dto.studentId) {
      const existing = await this.prisma.rating.findFirst({
        where: { studentId: dto.studentId, lessonId: dto.lessonId },
      });
      if (existing) {
        const updated = await this.prisma.rating.update({
          where: { id: existing.id },
          data: { score: dto.score, comment: dto.comment },
          select: SELECT_RATING,
        });
        return { message: 'Reyting yangilandi', rating: updated };
      }
    }

    const rating = await this.prisma.rating.create({
      data: { ...dto },
      select: SELECT_RATING,
    });

    return { message: "Reyting qo'shildi", rating };
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    teacherId?: number;
    lessonId?: number;
    studentId?: number;
  }) {
    const { page, limit, search, teacherId, lessonId, studentId } = params || {};
    const usePagination =
      page !== undefined ||
      limit !== undefined ||
      !!search ||
      teacherId !== undefined ||
      lessonId !== undefined ||
      studentId !== undefined;

    const where: any = {
      ...(teacherId ? { teacherId } : {}),
      ...(lessonId ? { lessonId } : {}),
      ...(studentId ? { studentId } : {}),
    };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { student: { fullName: { contains: q, mode: 'insensitive' } } },
        { teacher: { fullName: { contains: q, mode: 'insensitive' } } },
        { lesson: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (!usePagination) {
      return this.prisma.rating.findMany({
        where,
        select: SELECT_RATING,
        orderBy: { created_at: 'desc' },
      });
    }

    const { page: safePage, limit: safeLimit, skip } = this.buildPagination(page, limit);
    const [total, data] = await Promise.all([
      this.prisma.rating.count({ where }),
      this.prisma.rating.findMany({
        where,
        skip,
        take: safeLimit,
        select: SELECT_RATING,
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

  async findByStudent(studentId: number) {
    return this.prisma.rating.findMany({
      where: { studentId },
      select: SELECT_RATING,
      orderBy: { created_at: 'desc' },
    });
  }

  async findByTeacher(teacherId: number) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException("O'qituvchi topilmadi");

    const ratings = await this.prisma.rating.findMany({
      where: { teacherId },
      select: SELECT_RATING,
      orderBy: { created_at: 'desc' },
    });

    const avgScore =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : null;

    return { teacher: { id: teacher.id, fullName: teacher.fullName }, avgScore, totalRatings: ratings.length, ratings };
  }

  async remove(id: number) {
    const rating = await this.prisma.rating.findUnique({ where: { id } });
    if (!rating) throw new NotFoundException(`ID: ${id} bo'yicha reyting topilmadi`);
    await this.prisma.rating.delete({ where: { id } });
    return { message: `Reyting (ID: ${id}) o'chirildi` };
  }
}
