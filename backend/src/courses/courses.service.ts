import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
 
// Prisma Decimal -> Number ga o'girish
const normalizeCourse = (course: any) => ({
  ...course,
  price: course.price != null ? Number(course.price) : 0,
});
 
@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}
 
  async create(dto: CreateCourseDto) {
    const exists = await this.prisma.course.findUnique({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Bu nomdagi kurs allaqachon mavjud');
 
    const course = await this.prisma.course.create({ data: { ...dto } });
    return { message: "Kurs qo'shildi", course: normalizeCourse(course) };
  }
 
  async findAll() {
    const courses = await this.prisma.course.findMany({
      include: { _count: { select: { groups: true } } },
      orderBy: { created_at: 'desc' },
    });
    return courses.map(normalizeCourse);
  }
 
  async findOne(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { groups: true } } },
    });
    if (!course) throw new NotFoundException(`ID: ${id} bo'yicha kurs topilmadi`);
    return normalizeCourse(course);
  }
 
  async update(id: number, dto: UpdateCourseDto) {
    await this.findOne(id);
    const course = await this.prisma.course.update({ where: { id }, data: { ...dto } });
    return { message: "Kurs yangilandi", course: normalizeCourse(course) };
  }
 
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.course.update({ where: { id }, data: { status: 'INACTIVE' } });
    return { message: `Kurs (ID: ${id}) o'chirildi` };
  }
}