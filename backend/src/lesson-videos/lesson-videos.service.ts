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
 
  async create(dto: CreateLessonVideoDto, filename: string,size:number) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
 
    if (!filename) throw new BadRequestException('Video fayl yuklanmadi');
 
    const video = await this.prisma.lessonVideo.create({
      data: { ...dto, file: filename ,size},
      select: SELECT_VIDEO,
    });
 
    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    return {
      message: "Video qo'shildi",
      video: { ...video, fileUrl: `${baseUrl}/uploads/${filename}` },
    };
  }
 
  async findAll(lessonId?: number) {
    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    const videos = await this.prisma.lessonVideo.findMany({
      where: lessonId ? { lessonId } : undefined,
      select: SELECT_VIDEO,
      orderBy: { created_at: 'desc' },
    });
    // ✅ FIX: har bir videoga fileUrl qo'shildi
    return videos.map(v => ({ ...v, fileUrl: `${baseUrl}/uploads/${v.file}` }));
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
 
  async update(id: number, dto: UpdateLessonVideoDto) {
    await this.findOne(id);
    const video = await this.prisma.lessonVideo.update({
      where: { id },
      data: { ...dto },
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