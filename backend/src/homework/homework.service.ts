import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';

const SELECT_HOMEWORK = {
  id: true,
  title: true,
  file: true,
  durationTime: true,
  lessonId: true,
  teacherId: true,
  userId: true,
  created_at: true,
  updated_at: true,
  lesson: { select: { id: true, title: true, group: { select: { id: true, name: true } } } },
  teacher: { select: { id: true, fullName: true } },
  user: { select: { id: true, fullName: true } },
  _count: { select: { homeworkResponse: true, homeworkResult: true } },
};

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHomeworkDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    const homework = await this.prisma.homework.create({
      data: { ...dto },
      select: SELECT_HOMEWORK,
    });

    return { message: "Vazifa qo'shildi", homework };
  }

  async uploadFile(id: number, filename: string) {
    const homework = await this.prisma.homework.findUnique({ where: { id } });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');

    const updated = await this.prisma.homework.update({
      where: { id },
      data: { file: filename },
      select: { id: true, title: true, file: true },
    });

    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    return {
      message: 'Fayl yuklandi',
      file: `${baseUrl}/uploads/${filename}`,
      homework: updated,
    };
  }

  async findAll(lessonId?: number, studentId?: number) {
    const homeworks = await this.prisma.homework.findMany({
      where: lessonId ? { lessonId } : undefined,
      select: {
        ...SELECT_HOMEWORK,
        ...(studentId ? {
          homeworkResponse: {
            where: { studentId },
            select: { id: true, status: true, file: true, url: true, title: true, created_at: true },
          },
        } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
    return homeworks;
  }

  async findOne(id: number) {
    const homework = await this.prisma.homework.findUnique({
      where: { id },
      select: {
        ...SELECT_HOMEWORK,
        homeworkResponse: {
          select: {
            id: true,
            title: true,
            file: true,
            status: true,
            created_at: true,
            student: { select: { id: true, fullName: true, email: true } },
          },
        },
        homeworkResult: {
          select: {
            id: true,
            title: true,
            score: true,
            status: true,
            created_at: true,
            student: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!homework) throw new NotFoundException(`ID: ${id} bo'yicha vazifa topilmadi`);
    return homework;
  }

  async update(id: number, dto: UpdateHomeworkDto) {
    await this.findOne(id);
    const homework = await this.prisma.homework.update({
      where: { id },
      data: { ...dto },
      select: SELECT_HOMEWORK,
    });
    return { message: "Vazifa yangilandi", homework };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.homework.delete({ where: { id } });
    return { message: `Vazifa (ID: ${id}) o'chirildi` };
  }

  /**
   * Returns all students in the homework's group, each with their response status.
   * Grouped into 4 categories: PENDING, CHECKED, RETURNED, REJECTED
   */
  async getStudentStatuses(id: number) {
    const homework = await this.prisma.homework.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        lesson: { select: { id: true, title: true, groupId: true, group: { select: { id: true, name: true } } } },
        homeworkResponse: {
          select: {
            id: true,
            studentId: true,
            title: true,
            file: true,
            url: true,
            status: true,
            created_at: true,
            student: { select: { id: true, fullName: true, email: true, photo: true } },
          },
        },
      },
    });

    if (!homework) throw new NotFoundException(`ID: ${id} bo'yicha vazifa topilmadi`);

    // Get all students in the group
    const groupId = homework.lesson?.groupId;
    const groupStudents = groupId
      ? await this.prisma.studentGroup.findMany({
          where: { groupId },
          select: { student: { select: { id: true, fullName: true, email: true, photo: true } } },
        })
      : [];

    const responseMap = new Map(homework.homeworkResponse.map((r) => [r.studentId, r]));

    // Also fetch results for this homework
    const results = await this.prisma.homeworkResult.findMany({
      where: { homeworkId: id },
      select: { id: true, studentId: true, score: true, status: true, title: true, created_at: true },
    });
    const resultMap = new Map(results.map((r) => [r.studentId, r]));

    const students = groupStudents.map(({ student }) => {
      const response = responseMap.get(student.id) ?? null;
      const result = resultMap.get(student.id) ?? null;
      return {
        student,
        response,
        result,
        status: response?.status ?? 'NOT_SUBMITTED',
      };
    });

    const grouped = {
      PENDING: students.filter((s) => s.status === 'PENDING'),
      CHECKED: students.filter((s) => s.status === 'CHECKED'),
      RETURNED: students.filter((s) => s.status === 'RETURNED'),
      REJECTED: students.filter((s) => s.status === 'REJECTED'),
      NOT_SUBMITTED: students.filter((s) => s.status === 'NOT_SUBMITTED'),
    };

    return {
      homework: { id: homework.id, title: homework.title, lesson: homework.lesson },
      grouped,
      total: students.length,
    };
  }
}
