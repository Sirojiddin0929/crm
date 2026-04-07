import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentDto } from './dto/add-student.dto';

const SELECT_GROUP = {
  id: true,
  name: true,
  capacity: true,
  startDate: true,
  startTime: true,
  weekDays: true,
  status: true,
  courseId: true,
  teacherId: true,
  roomId: true,
  created_at: true,
  updated_at: true,
  course: { select: { id: true, name: true, level: true, durationMonth: true ,price:true} },
  room: { select: { id: true, name: true, capacity: true } },
  teacher: { select: { id: true, fullName: true, position: true } },
  user: { select: { id: true, fullName: true, role: true } },
  _count: { select: { studentGroup: true, lesson: true } },
};

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGroupDto) {
    const exists = await this.prisma.group.findFirst({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Bu nomdagi guruh allaqachon mavjud');

    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('Xona topilmadi');
    if (dto.capacity > room.capacity)
      throw new BadRequestException(
        `Guruh sig'imi (${dto.capacity}) xona sig'imidan (${room.capacity}) oshib ketdi`,
      );

    const group = await this.prisma.group.create({
      data: {
        teacherId: dto.teacherId,
        userId: dto.userId,
        roomId: dto.roomId,
        courseId: dto.courseId,
        name: dto.name,
        capacity: dto.capacity,
        startDate: new Date(dto.startDate),
        startTime: dto.startTime,
        weekDays: dto.weekDays,
      },
      select: SELECT_GROUP,
    });

    return { message: "Guruh qo'shildi", group };
  }

  async findAll(teacherId?: number, courseId?: number) {
    return this.prisma.group.findMany({
      where: {
        ...(teacherId ? { teacherId } : {}),
        ...(courseId ? { courseId } : {}),
      },
      select: SELECT_GROUP,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      select: {
        ...SELECT_GROUP,
        studentGroup: {
          select: {
            id: true,
            status: true,
            student: {
              select: { id: true, fullName: true, email: true, photo: true, status: true },
            },
          },
        },
      },
    });

    if (!group) throw new NotFoundException(`ID: ${id} bo'yicha guruh topilmadi`);
    return group;
  }

  async update(id: number, dto: UpdateGroupDto) {
    const existing = await this.findOne(id);

    if (dto.capacity !== undefined || dto.roomId !== undefined) {
      const roomId = dto.roomId ?? (existing as any).room.id;
      const newCapacity = dto.capacity ?? (existing as any).capacity;
      const room = await this.prisma.room.findUnique({ where: { id: roomId } });
      if (!room) throw new NotFoundException('Xona topilmadi');
      if (newCapacity > room.capacity)
        throw new BadRequestException(
          `Guruh sig'imi (${newCapacity}) xona sig'imidan (${room.capacity}) oshib ketdi`,
        );
    }

    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);

    const group = await this.prisma.group.update({
      where: { id },
      data,
      select: SELECT_GROUP,
    });

    return { message: "Guruh ma'lumotlari yangilandi", group };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.group.update({ where: { id }, data: { status: 'INACTIVE' } });
    return { message: `Guruh (ID: ${id}) o'chirildi` };
  }

  async addStudent(groupId: number, dto: AddStudentDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`Guruh topilmadi`);

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) throw new NotFoundException(`O'quvchi topilmadi`);

    const already = await this.prisma.studentGroup.findUnique({
      where: { groupId_studentId: { groupId, studentId: dto.studentId } },
    });
    if (already) throw new BadRequestException("O'quvchi bu guruhda allaqachon mavjud");

    const currentCount = await this.prisma.studentGroup.count({ where: { groupId, status: 'ACTIVE' } });
    if (currentCount >= group.capacity) throw new BadRequestException("Guruh sig'imi to'lgan");

    const studentGroup = await this.prisma.studentGroup.create({
      data: { groupId, studentId: dto.studentId },
      select: {
        id: true,
        status: true,
        student: { select: { id: true, fullName: true, email: true } },
      },
    });

    return { message: "O'quvchi guruhga qo'shildi", studentGroup };
  }

  async removeStudent(groupId: number, studentId: number) {
    const record = await this.prisma.studentGroup.findUnique({
      where: { groupId_studentId: { groupId, studentId } },
    });
    if (!record) throw new NotFoundException("O'quvchi bu guruhda topilmadi");

    await this.prisma.studentGroup.update({
      where: { groupId_studentId: { groupId, studentId } },
      data: { status: 'INACTIVE' },
    });

    return { message: "O'quvchi guruhdan chiqarildi" };
  }

  async getStudents(groupId: number) {
    await this.findOne(groupId);
    return this.prisma.studentGroup.findMany({
      where: { groupId },
      select: {
        id: true,
        status: true,
        created_at: true,
        student: {
          select: { id: true, fullName: true, email: true, photo: true, status: true, birth_date: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
