import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomeworkResponseDto } from './dto/create-homework-response.dto';
import { UpdateHomeworkResponseDto } from './dto/update-homework-response.dto';

const SELECT_RESPONSE = {
  id: true,
  title: true,
  file: true,
  url: true,
  status: true,
  homeworkId: true,
  studentId: true,
  created_at: true,
  updated_at: true,
  homework: { select: { id: true, title: true, lesson: { select: { id: true, title: true } } } },
  student: { select: { id: true, fullName: true, email: true } },
};
const SELECT_RESPONSE_COMPACT = {
  id: true,
  title: true,
  file: true,
  url: true,
  status: true,
  homeworkId: true,
  studentId: true,
  created_at: true,
  updated_at: true,
};

@Injectable()
export class HomeworkResponsesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateHomeworkResponseDto) {
    if (!dto.studentId) throw new BadRequestException("O'quvchi ID aniqlanmadi");

    const homework = await this.prisma.homework.findUnique({ where: { id: dto.homeworkId } });
    if (!homework) throw new NotFoundException('Vazifa topilmadi');

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");

    // If already submitted, treat this as resubmission and reopen as PENDING
    const existing = await this.prisma.homeworkResponse.findFirst({
      where: { homeworkId: dto.homeworkId, studentId: dto.studentId },
    });
    if (existing) {
      const response = await this.prisma.homeworkResponse.update({
        where: { id: existing.id },
        data: {
          title: dto.title ?? existing.title ?? null,
          url: dto.url ?? existing.url ?? null,
          status: 'PENDING',
        },
        select: SELECT_RESPONSE,
      });

      return {
        message: "Vazifa javobi qayta yuborildi",
        response,
      };
    }

    const response = await this.prisma.homeworkResponse.create({
      data: {
        homeworkId: dto.homeworkId,
        studentId: dto.studentId,
        title: dto.title ?? null,
        url: dto.url ?? null,
        status: 'PENDING',
      },
      select: SELECT_RESPONSE,
    });

    return { message: "Vazifa javobi qo'shildi", response };
  }

  async uploadFile(id: number, filename: string) {
    const response = await this.prisma.homeworkResponse.findUnique({ where: { id } });
    if (!response) throw new NotFoundException('Javob topilmadi');

    const updated = await this.prisma.homeworkResponse.update({
      where: { id },
      data: { file: filename },
      select: { id: true, title: true, file: true },
    });

    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    return {
      message: 'Fayl yuklandi',
      file: `${baseUrl}/uploads/${filename}`,
      response: updated,
    };
  }

  async findAll(homeworkId?: number, studentId?: number, groupId?: number, compact?: boolean) {
    return this.prisma.homeworkResponse.findMany({
      where: {
        ...(homeworkId ? { homeworkId } : {}),
        ...(studentId ? { studentId } : {}),
        ...(groupId ? { homework: { lesson: { groupId } } } : {}),
      },
      select: compact ? SELECT_RESPONSE_COMPACT : SELECT_RESPONSE,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const response = await this.prisma.homeworkResponse.findUnique({
      where: { id },
      select: SELECT_RESPONSE,
    });
    if (!response) throw new NotFoundException(`ID: ${id} bo'yicha javob topilmadi`);
    return response;
  }

  async update(id: number, dto: UpdateHomeworkResponseDto) {
    await this.findOne(id);
    const response = await this.prisma.homeworkResponse.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.url !== undefined ? { url: dto.url } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      select: SELECT_RESPONSE,
    });
    return { message: "Javob yangilandi", response };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.homeworkResponse.delete({ where: { id } });
    return { message: `Javob (ID: ${id}) o'chirildi` };
  }
}
