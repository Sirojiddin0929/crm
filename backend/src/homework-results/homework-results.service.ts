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
  homework: { select: { id: true, title: true, lesson: { select: { id: true, title: true } } } },
  student: { select: { id: true, fullName: true, email: true, xp: true, coin: true } },
  teacher: { select: { id: true, fullName: true } },
  user: { select: { id: true, fullName: true } },
};

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

    const result = await this.prisma.homeworkResult.create({
      data: {
        homeworkId: dto.homeworkId,
        studentId: dto.studentId,
        score: dto.score,
        xp: dto.xp || 0,
        coin: dto.coin || 0,
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

    // Increment student XP and Coins
    if (dto.xp || dto.coin) {
      await this.prisma.student.update({
        where: { id: dto.studentId },
        data: {
          xp: { increment: dto.xp || 0 },
          coin: { increment: dto.coin || 0 },
        },
      });
    }

    return { message: "Baholash qo'shildi", result };
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

  async findAll(homeworkId?: number, studentId?: number) {
    return this.prisma.homeworkResult.findMany({
      where: {
        ...(homeworkId ? { homeworkId } : {}),
        ...(studentId ? { studentId } : {}),
      },
      select: SELECT_RESULT,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const result = await this.prisma.homeworkResult.findUnique({
      where: { id },
      select: SELECT_RESULT,
    });
    if (!result) throw new NotFoundException(`ID: ${id} bo'yicha natija topilmadi`);
    return result;
  }

  async update(id: number, dto: UpdateHomeworkResultDto) {
    const existing = await this.findOne(id);
    const newScore = dto.score !== undefined ? dto.score : existing.score;
    const resultStatus = newScore >= 60 ? 'APPROVED' : 'REJECTED';
    const responseStatus = newScore >= 60 ? 'CHECKED' : 'RETURNED';

    const result = await this.prisma.homeworkResult.update({
      where: { id },
      data: {
        ...dto,
        status: resultStatus,
      },
      select: SELECT_RESULT,
    });

    // Re-sync response status
    await this.prisma.homeworkResponse.updateMany({
      where: { homeworkId: existing.homeworkId, studentId: existing.studentId },
      data: { status: responseStatus },
    });

    return { message: "Baholash yangilandi", result };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.homeworkResult.delete({ where: { id } });
    return { message: `Baholash (ID: ${id}) o'chirildi` };
  }
}
