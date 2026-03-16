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

  async findAll(groupId?: number, teacherId?: number) {
    return this.prisma.lesson.findMany({
      where: {
        ...(groupId ? { groupId } : {}),
        ...(teacherId ? { teacherId } : {}),
      },
      select: SELECT_LESSON,
      orderBy: { created_at: 'desc' },
    });
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
