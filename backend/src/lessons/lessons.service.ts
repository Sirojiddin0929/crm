import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

const SELECT_LESSON = {
  id: true,
  title: true,
  date: true,
  description: true,
  groupId: true,
  teacherId: true,
  userId: true,
  created_at: true,
  updated_at: true,
  group: { select: { id: true, name: true, course: { select: { id: true, name: true } } } },
  teacher: { select: { id: true, fullName: true } },
  user: { select: { id: true, fullName: true } },
  _count: { select: { lesson: true, lessonHomework: true, lessonVideo: true } },
};

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  private buildPagination(page?: number, limit?: number) {
    const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
  }

  async create(dto: CreateLessonDto) {
  const group = await this.prisma.group.findUnique({
    where: { id: dto.groupId },
  });

  if (!group) {
    throw new NotFoundException("Guruh topilmadi");
  }

  const lesson = await this.prisma.lesson.create({
    data: {
      groupId: dto.groupId,
      title: dto.title,
      description: dto.description,
      date: dto.date ? new Date(dto.date) : null,
      teacherId: dto.teacherId ?? null,
      userId: dto.userId ?? null,
    },
    select: SELECT_LESSON,
  });

  return {
    message: "Dars qo'shildi",
    lesson,
  };
}

  async findAll(params?: { groupId?: number; teacherId?: number; page?: number; limit?: number; search?: string }) {
    const { groupId, teacherId, page, limit, search } = params || {};
    const usePagination = page !== undefined || limit !== undefined || !!search;

    const where: any = {
      ...(groupId ? { groupId } : {}),
      ...(teacherId ? { teacherId } : {}),
    };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { group: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (!usePagination) {
      return this.prisma.lesson.findMany({
        where,
        select: SELECT_LESSON,
        orderBy: { created_at: 'desc' },
      });
    }

    const { page: safePage, limit: safeLimit, skip } = this.buildPagination(page, limit);
    const [total, data] = await Promise.all([
      this.prisma.lesson.count({ where }),
      this.prisma.lesson.findMany({
        where,
        skip,
        take: safeLimit,
        select: SELECT_LESSON,
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

  async findOne(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: {
        ...SELECT_LESSON,
        lessonVideo: { select: { id: true, title: true, file: true, created_at: true } },
        lessonHomework: {
          select: {
            id: true,
            title: true,
            file: true,
            durationTime: true,
            created_at: true,
            _count: { select: { homeworkResponse: true } },
          },
        },
        lesson: {
          select: {
            id: true,
            isPresent: true,
            student: { select: { id: true, fullName: true } },
          },
        },
        rating: { select: { id: true, score: true, teacher: { select: { id: true, fullName: true } } } },
      },
    });

    if (!lesson) throw new NotFoundException(`ID: ${id} bo'yicha dars topilmadi`);
    return lesson;
  }

  async update(id: number, dto: UpdateLessonDto) {
    await this.findOne(id);
    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: { ...dto },
      select: SELECT_LESSON,
    });
    return { message: "Dars ma'lumotlari yangilandi", lesson };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.lesson.delete({ where: { id } });
    return { message: `Dars (ID: ${id}) o'chirildi` };
  }
}
