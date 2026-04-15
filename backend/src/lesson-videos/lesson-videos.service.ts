import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonVideoDto } from './dto/create-lesson-video.dto';
import { UpdateLessonVideoDto } from './dto/update-lesson-video.dto';
 
const SELECT_VIDEO = {
  id: true,
  title: true,
  file: true,
  size:true,
  lessonId: true,
  teacherId: true,
  userId: true,
  created_at: true,
  lesson: { select: { id: true, title: true, group: { select: { id: true, name: true } } } },
  teacher: { select: { id: true, fullName: true } },
  user: { select: { id: true, fullName: true } },
};
 
@Injectable()
export class LessonVideosService {
  constructor(private prisma: PrismaService) {}

  private buildPagination(page?: number, limit?: number) {
    const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
  }
 
  async create(dto: CreateLessonVideoDto, filename: string,size:number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
 
    if (!filename) throw new BadRequestException('Video fayl yuklanmadi');
 
    const video = await this.prisma.lessonVideo.create({
      data: {
        ...dto,
        title: dto.title?.trim() || filename,
        teacherId: dto.teacherId ?? lesson.teacherId ?? null,
        userId: dto.userId ?? lesson.userId ?? null,
        file: filename,
        size,
      },
      select: SELECT_VIDEO,
    });
 
    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    return {
      message: "Video qo'shildi",
      video: { ...video, fileUrl: `${baseUrl}/uploads/${filename}` },
    };
  }
 
  async findAll(params?: {
    lessonId?: number;
    groupId?: number;
    courseId?: number;
    teacherId?: number;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { lessonId, groupId, courseId, teacherId, page, limit, search } = params || {};
    const usePagination = page !== undefined || limit !== undefined || !!search;
    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    const lessonWhere: any = {
      ...(groupId ? { groupId } : {}),
      ...(courseId ? { group: { courseId } } : {}),
    };

    const where: any = {
      ...(lessonId ? { lessonId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...((groupId || courseId) ? { lesson: lessonWhere } : {}),
    };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { lesson: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (!usePagination) {
      const videos = await this.prisma.lessonVideo.findMany({
        where,
        select: SELECT_VIDEO,
        orderBy: { created_at: 'desc' },
      });
      return videos.map(v => ({ ...v, fileUrl: `${baseUrl}/uploads/${v.file}` }));
    }

    const { page: safePage, limit: safeLimit, skip } = this.buildPagination(page, limit);
    const [total, videos] = await Promise.all([
      this.prisma.lessonVideo.count({ where }),
      this.prisma.lessonVideo.findMany({
        where,
        skip,
        take: safeLimit,
        select: SELECT_VIDEO,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return {
      data: videos.map(v => ({ ...v, fileUrl: `${baseUrl}/uploads/${v.file}` })),
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
    const video = await this.prisma.lessonVideo.findUnique({
      where: { id },
      select: SELECT_VIDEO,
    });
    if (!video) throw new NotFoundException(`ID: ${id} bo'yicha video topilmadi`);
 
    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    return { ...video, fileUrl: `${baseUrl}/uploads/${video.file}` };
  }
 
  async update(id: number, dto: UpdateLessonVideoDto, filename?: string, size?: number) {
    await this.findOne(id);
    const video = await this.prisma.lessonVideo.update({
      where: { id },
      data: {
        ...dto,
        ...(filename ? { file: filename } : {}),
        ...(size ? { size } : {}),
      },
      select: SELECT_VIDEO,
    });
    return { message: "Video ma'lumotlari yangilandi", video };
  }
 
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.lessonVideo.delete({ where: { id } });
    return { message: `Video (ID: ${id}) o'chirildi` };
  }
}
