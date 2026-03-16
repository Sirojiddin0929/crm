import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

const SELECT_RATING = {
  id: true,
  score: true,
  comment: true,
  studentId: true,
  created_at: true,
  teacher: { select: { id: true, fullName: true } },
  lesson: { select: { id: true, title: true, group: { select: { id: true, name: true } } } },
};

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

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

  async findAll() {
    return this.prisma.rating.findMany({
      select: SELECT_RATING,
      orderBy: { created_at: 'desc' },
    });
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
