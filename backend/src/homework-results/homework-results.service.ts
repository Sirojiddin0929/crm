import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomeworkResultDto } from './dto/create-homework-result.dto';
import { UpdateHomeworkResultDto } from './dto/update-homework-result.dto';

const SELECT_RESULT = {
  id: true,
  title: true,
  file: true,
  score: true,
  xp: true,
  coin: true,
  status: true,
  homeworkId: true,
  studentId: true,
  teacherId: true,
  userId: true,
  created_at: true,
  updated_at: true,
  homework: {
    select: {
      id: true,
      title: true,
      created_at: true,
      lesson: {
        select: {
          id: true,
          title: true,
          group: { select: { id: true, name: true } },
        },
      },
    },
  },
  student: { select: { id: true, fullName: true, email: true, xp: true, coin: true } },
  teacher: { select: { id: true, fullName: true } },
  user: { select: { id: true, fullName: true } },
};
const SELECT_RESULT_COMPACT = {
  id: true,
  title: true,
  file: true,
  score: true,
  xp: true,
  coin: true,
  status: true,
  homeworkId: true,
  studentId: true,
  teacherId: true,
  userId: true,
  created_at: true,
  updated_at: true,
};

function serializeResult(result: any) {
  if (!result) return result;
  return {
    ...result,
    comment: result.title ?? '',
  };
}

function calculateXpByScore(score: number) {
  if (score >= 90) return 6;
  if (score >= 70) return 4;
  if (score >= 60) return 2;
  return 0;
}

@Injectable()
export class HomeworkResultsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHomeworkResultDto) {
    const homework = await this.prisma.homework.findUnique({ where: { id: dto.homeworkId } });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");

    // Auto-calculate status from score
    const resultStatus = dto.score >= 60 ? 'APPROVED' : 'REJECTED';
    // Update HomeworkResponse status accordingly
    const responseStatus = dto.score >= 60 ? 'CHECKED' : 'RETURNED';
    const nextXp = calculateXpByScore(dto.score);
    const nextCoin = nextXp * 10;

    const existing = await this.prisma.homeworkResult.findFirst({
      where: { homeworkId: dto.homeworkId, studentId: dto.studentId },
      select: { id: true, xp: true, coin: true },
    });

    const result = existing
      ? await this.prisma.homeworkResult.update({
          where: { id: existing.id },
          data: {
            score: dto.score,
            xp: nextXp,
            coin: nextCoin,
            title: dto.title ?? '',
            status: resultStatus,
            ...(dto.userId ? { userId: dto.userId } : { userId: null }),
            ...(dto.teacherId ? { teacherId: dto.teacherId } : { teacherId: null }),
          },
          select: SELECT_RESULT,
        })
      : await this.prisma.homeworkResult.create({
          data: {
            homeworkId: dto.homeworkId,
            studentId: dto.studentId,
            score: dto.score,
            xp: nextXp,
            coin: nextCoin,
            title: dto.title ?? '',
            status: resultStatus,
            ...(dto.userId ? { userId: dto.userId } : {}),
            ...(dto.teacherId ? { teacherId: dto.teacherId } : {}),
          },
          select: SELECT_RESULT,
        });

    // Update the corresponding HomeworkResponse status
    await this.prisma.homeworkResponse.updateMany({
      where: { homeworkId: dto.homeworkId, studentId: dto.studentId },
      data: { status: responseStatus },
    });

    // Keep student balances in sync (1 XP = 10 coins)
    const deltaXp = existing ? nextXp - (existing.xp || 0) : nextXp;
    const deltaCoin = existing ? nextCoin - (existing.coin || 0) : nextCoin;
    if (deltaXp !== 0 || deltaCoin !== 0) {
      await this.prisma.student.update({
        where: { id: dto.studentId },
        data: {
          xp: { increment: deltaXp },
          coin: { increment: deltaCoin },
        },
      });
    }

    return { message: existing ? "Baholash yangilandi" : "Baholash qo'shildi", result: serializeResult(result) };
  }

  async uploadFile(id: number, filename: string) {
    const result = await this.prisma.homeworkResult.findUnique({ where: { id } });
    if (!result) throw new NotFoundException('Natija topilmadi');

    const updated = await this.prisma.homeworkResult.update({
      where: { id },
      data: { file: filename },
      select: { id: true, title: true, file: true },
    });

    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    return {
      message: 'Fayl yuklandi',
      file: `${baseUrl}/uploads/${filename}`,
      result: updated,
    };
  }

  async findAll(homeworkId?: number, studentId?: number, groupId?: number, compact?: boolean) {
    const results = await this.prisma.homeworkResult.findMany({
      where: {
        ...(homeworkId ? { homeworkId } : {}),
        ...(studentId ? { studentId } : {}),
        ...(groupId ? { homework: { lesson: { groupId } } } : {}),
      },
      select: compact ? SELECT_RESULT_COMPACT : SELECT_RESULT,
      orderBy: { created_at: 'desc' },
    });
    return results.map(serializeResult);
  }

  async findOne(id: number) {
    const result = await this.prisma.homeworkResult.findUnique({
      where: { id },
      select: SELECT_RESULT,
    });
    if (!result) throw new NotFoundException(`ID: ${id} bo'yicha natija topilmadi`);
    return serializeResult(result);
  }

  async update(id: number, dto: UpdateHomeworkResultDto) {
    const existing = await this.findOne(id);
    const newScore = dto.score !== undefined ? dto.score : existing.score;
    const resultStatus = newScore >= 60 ? 'APPROVED' : 'REJECTED';
    const responseStatus = newScore >= 60 ? 'CHECKED' : 'RETURNED';
    const nextXp = calculateXpByScore(newScore);
    const nextCoin = nextXp * 10;
    const { xp: _ignoredXp, coin: _ignoredCoin, ...safeDto } = dto as any;

    const result = await this.prisma.homeworkResult.update({
      where: { id },
      data: {
        ...safeDto,
        xp: nextXp,
        coin: nextCoin,
        status: resultStatus,
      },
      select: SELECT_RESULT,
    });

    // Re-sync response status
    await this.prisma.homeworkResponse.updateMany({
      where: { homeworkId: existing.homeworkId, studentId: existing.studentId },
      data: { status: responseStatus },
    });

    const deltaXp = nextXp - (existing.xp || 0);
    const deltaCoin = nextCoin - (existing.coin || 0);
    if (deltaXp !== 0 || deltaCoin !== 0) {
      await this.prisma.student.update({
        where: { id: existing.studentId },
        data: {
          xp: { increment: deltaXp },
          coin: { increment: deltaCoin },
        },
      });
    }

    return { message: "Baholash yangilandi", result: serializeResult(result) };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.homeworkResult.delete({ where: { id } });
    return { message: `Baholash (ID: ${id}) o'chirildi` };
  }
}
