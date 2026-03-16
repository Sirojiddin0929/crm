import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { BulkCreateAttendanceDto } from './dto/bulk-create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

const SELECT_ATTENDANCE = {
  id: true,
  lessonId: true,
  isPresent: true,
  created_at: true,
  updated_at: true,
  student: { select: { id: true, fullName: true, email: true, photo: true } },
  lesson: { select: { id: true, title: true, group: { select: { id: true, name: true } } } },
  teacher: { select: { id: true, fullName: true } },
  user: { select: { id: true, fullName: true } },
};

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAttendanceDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");

    const attendance = await this.prisma.attendance.create({
      data: {
        ...dto,
        teacherId: dto.teacherId ?? lesson.teacherId ?? null,
        userId:    dto.userId    ?? lesson.userId    ?? 1,
      },
      select: SELECT_ATTENDANCE,
    });

    return { message: "Davomat belgilandi", attendance };
  }

  async bulkCreate(dto: BulkCreateAttendanceDto) {
    if (dto.records.length === 0)
      throw new BadRequestException("Davomat yozuvlari bo'sh bo'lishi mumkin emas");

    const lessonIds = [...new Set(dto.records.map(r => r.lessonId))];

    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, teacherId: true, userId: true },
    });
    const lessonMap = Object.fromEntries(lessons.map(l => [l.id, l]));

    // $transaction o'rniga createMany — bitta query, timeout yo'q
    await this.prisma.attendance.createMany({
      data: dto.records.map((r) => {
        const lesson = lessonMap[r.lessonId];
        return {
          lessonId:  r.lessonId,
          studentId: r.studentId,
          isPresent: r.isPresent,
          teacherId: r.teacherId ?? lesson?.teacherId ?? null,
          userId:    r.userId    ?? lesson?.userId    ?? 1,
        };
      }),
      skipDuplicates: true,
    });

    const created = await this.prisma.attendance.findMany({
      where: {
        lessonId:  { in: lessonIds },
        studentId: { in: dto.records.map(r => r.studentId) },
      },
      select: SELECT_ATTENDANCE,
      orderBy: { created_at: 'asc' },
    });

    return { message: `${created.length} ta davomat yozuvi qo'shildi`, attendance: created };
  }

  async findByLesson(lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    return this.prisma.attendance.findMany({
      where: { lessonId },
      select: SELECT_ATTENDANCE,
      orderBy: { created_at: 'asc' },
    });
  }

  async findByStudent(studentId: number) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");

    return this.prisma.attendance.findMany({
      where: { studentId },
      select: {
        ...SELECT_ATTENDANCE,
        lesson: { select: { id: true, title: true, group: { select: { id: true, name: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.attendance.findMany({
      select: SELECT_ATTENDANCE,
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: number, dto: UpdateAttendanceDto) {
    const record = await this.prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`ID: ${id} bo'yicha davomat topilmadi`);

    const attendance = await this.prisma.attendance.update({
      where: { id },
      data: { isPresent: dto.isPresent },
      select: SELECT_ATTENDANCE,
    });

    return { message: "Davomat yangilandi", attendance };
  }
}
