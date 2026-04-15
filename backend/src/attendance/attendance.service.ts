import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { BulkCreateAttendanceDto } from './dto/bulk-create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

const ATTENDANCE_PRESENT_XP = 4;
const ATTENDANCE_PRESENT_COIN = 40;

const SELECT_ATTENDANCE = {
  id: true,
  lessonId: true,
  studentId: true,
  isPresent: true,
  created_at: true,
  updated_at: true,
  student: { select: { id: true, fullName: true, email: true, photo: true } },
  lesson: { select: { id: true, title: true, group: { select: { id: true, name: true } } } },
  teacher: { select: { id: true, fullName: true } },
  user: { select: { id: true, fullName: true } },
};

function keepLatestAttendance(records: Array<{ studentId: number }>) {
  const seen = new Set<number>();

  return records.filter(record => {
    if (seen.has(record.studentId)) return false;
    seen.add(record.studentId);
    return true;
  });
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private async withTxRetry<T>(runner: (tx: any) => Promise<T>, attempts = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.prisma.$transaction(runner);
      } catch (error: any) {
        lastError = error;
        if (error?.code !== 'P2028' || i === attempts - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 200 * (i + 1)));
      }
    }
    throw lastError;
  }

  async create(dto: CreateAttendanceDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");

    const existing = await this.prisma.attendance.findFirst({
      where: { lessonId: dto.lessonId, studentId: dto.studentId },
      select: { id: true },
    });
    if (existing) throw new BadRequestException("Bu dars uchun davomat allaqachon saqlangan");

    const attendance = await this.withTxRetry(async (tx) => {
      const created = await tx.attendance.create({
        data: {
          ...dto,
          teacherId: dto.teacherId ?? lesson.teacherId ?? null,
          userId: dto.userId ?? lesson.userId ?? 1,
        },
        select: SELECT_ATTENDANCE,
      });

      if (dto.isPresent) {
        await tx.student.update({
          where: { id: dto.studentId },
          data: {
            xp: { increment: ATTENDANCE_PRESENT_XP },
            coin: { increment: ATTENDANCE_PRESENT_COIN },
          },
        });
      }

      return created;
    });

    return {
      message: "Davomat belgilandi",
      attendance: {
        ...attendance,
        awardedXp: dto.isPresent ? ATTENDANCE_PRESENT_XP : 0,
        awardedCoin: dto.isPresent ? ATTENDANCE_PRESENT_COIN : 0,
      },
    };
  }

  async bulkCreate(dto: BulkCreateAttendanceDto) {
    if (dto.records.length === 0)
      throw new BadRequestException("Davomat yozuvlari bo'sh bo'lishi mumkin emas");

    const lessonIds = [...new Set(dto.records.map(r => r.lessonId))];

    const existingCount = await this.prisma.attendance.count({
      where: { lessonId: { in: lessonIds } },
    });
    if (existingCount > 0)
      throw new BadRequestException("Bu dars uchun davomat allaqachon saqlangan va qayta o'zgartirib bo'lmaydi");

    const lessons = await this.prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
      select: { id: true, teacherId: true, userId: true },
    });
    const lessonMap = Object.fromEntries(lessons.map(l => [l.id, l]));

    const created = await this.withTxRetry(async (tx) => {
      await tx.attendance.createMany({
        data: dto.records.map((r) => {
          const lesson = lessonMap[r.lessonId];
          return {
            lessonId: r.lessonId,
            studentId: r.studentId,
            isPresent: r.isPresent,
            teacherId: r.teacherId ?? lesson?.teacherId ?? null,
            userId: r.userId ?? lesson?.userId ?? 1,
          };
        }),
        skipDuplicates: true,
      });

      const presentByStudent = new Map<number, number>();
      for (const record of dto.records) {
        if (!record.isPresent) continue;
        presentByStudent.set(record.studentId, (presentByStudent.get(record.studentId) || 0) + 1);
      }

      for (const [studentId, count] of presentByStudent.entries()) {
        await tx.student.update({
          where: { id: studentId },
          data: {
            xp: { increment: count * ATTENDANCE_PRESENT_XP },
            coin: { increment: count * ATTENDANCE_PRESENT_COIN },
          },
        });
      }

      return tx.attendance.findMany({
        where: {
          lessonId: { in: lessonIds },
          studentId: { in: dto.records.map(r => r.studentId) },
        },
        select: SELECT_ATTENDANCE,
        orderBy: { created_at: 'asc' },
      });
    });

    return {
      message: `${created.length} ta davomat yozuvi qo'shildi`,
      attendance: created.map((a) => ({
        ...a,
        awardedXp: a.isPresent ? ATTENDANCE_PRESENT_XP : 0,
        awardedCoin: a.isPresent ? ATTENDANCE_PRESENT_COIN : 0,
      })),
    };
  }

  async findByLesson(lessonId: number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    const records = await this.prisma.attendance.findMany({
      where: { lessonId },
      select: SELECT_ATTENDANCE,
      orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
    });

    return keepLatestAttendance(records);
  }

  async findByStudent(studentId: number) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");

    const attendance = await this.prisma.attendance.findMany({
      where: { studentId },
      select: {
        ...SELECT_ATTENDANCE,
        lesson: { select: { id: true, title: true, group: { select: { id: true, name: true } } } },
      },
      orderBy: { created_at: 'desc' },
    });

    return attendance.map((a) => ({
      ...a,
      awardedXp: a.isPresent ? ATTENDANCE_PRESENT_XP : 0,
      awardedCoin: a.isPresent ? ATTENDANCE_PRESENT_COIN : 0,
    }));
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

    throw new BadRequestException("Davomat saqlangandan keyin uni tahrirlab bo'lmaydi");
  }
}
