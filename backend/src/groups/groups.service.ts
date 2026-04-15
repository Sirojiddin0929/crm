import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { AddStudentsDto } from './dto/add-students.dto';

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
const SELECT_GROUP_COMPACT = {
  id: true,
  name: true,
  status: true,
  courseId: true,
  teacherId: true,
  roomId: true,
  startDate: true,
  startTime: true,
  weekDays: true,
  capacity: true,
};

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  private buildPagination(page?: number, limit?: number) {
    const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
    const safeLimit = Number.isFinite(limit) && limit && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
  }

  async create(dto: CreateGroupDto) {
    const exists = await this.prisma.group.findFirst({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Bu nomdagi guruh allaqachon mavjud');

    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('Xona topilmadi');
    const group = await this.prisma.group.create({
      data: {
        teacherId: dto.teacherId,
        userId: dto.userId,
        roomId: dto.roomId,
        courseId: dto.courseId,
        name: dto.name,
        capacity: room.capacity,
        startDate: new Date(dto.startDate),
        startTime: dto.startTime,
        weekDays: dto.weekDays,
      },
      select: SELECT_GROUP,
    });

    return { message: "Guruh qo'shildi", group };
  }

  async findAll(params?: {
    teacherId?: number;
    courseId?: number;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    compact?: boolean;
  }) {
    const { teacherId, courseId, page, limit, search, status, compact } = params || {};
    const usePagination = page !== undefined || limit !== undefined || !!search || !!status;

    const normalizedStatus = status?.toUpperCase();
    const where: any = {
      ...(teacherId ? { teacherId } : {}),
      ...(courseId ? { courseId } : {}),
      ...(normalizedStatus && ['ACTIVE', 'INACTIVE', 'FREEZE'].includes(normalizedStatus)
        ? { status: normalizedStatus }
        : {}),
    };

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { teacher: { fullName: { contains: q, mode: 'insensitive' } } },
        { course: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (!usePagination) {
      return this.prisma.group.findMany({
        where,
        select: compact ? SELECT_GROUP_COMPACT : SELECT_GROUP,
        orderBy: { created_at: 'desc' },
      });
    }

    const { page: safePage, limit: safeLimit, skip } = this.buildPagination(page, limit);
    const [total, data] = await Promise.all([
      this.prisma.group.count({ where }),
      this.prisma.group.findMany({
        where,
        skip,
        take: safeLimit,
        select: compact ? SELECT_GROUP_COMPACT : SELECT_GROUP,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    return {
      data,
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
      const room = await this.prisma.room.findUnique({ where: { id: roomId } });
      if (!room) throw new NotFoundException('Xona topilmadi');

      // Capacity always follows room capacity.
      dto.capacity = room.capacity;
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
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, capacity: true, roomId: true, status: true },
    });
    if (!group) throw new NotFoundException(`Guruh topilmadi`);
    if (group.status !== 'ACTIVE') throw new BadRequestException("Faol bo'lmagan guruhga o'quvchi qo'shib bo'lmaydi");

    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { id: true, status: true },
    });
    if (!student) throw new NotFoundException(`O'quvchi topilmadi`);
    if (student.status !== 'ACTIVE') throw new BadRequestException("Faol bo'lmagan o'quvchini guruhga qo'shib bo'lmaydi");

    const room = await this.prisma.room.findUnique({
      where: { id: group.roomId },
      select: { capacity: true },
    });
    const maxCapacity = room ? Math.min(group.capacity, room.capacity) : group.capacity;

    const already = await this.prisma.studentGroup.findUnique({
      where: { groupId_studentId: { groupId, studentId: dto.studentId } },
    });

    const currentCount = await this.prisma.studentGroup.count({ where: { groupId, status: 'ACTIVE' } });
    if (currentCount >= maxCapacity) throw new BadRequestException("Xona sig'imi allaqachon to'lgan");

    if (already?.status === 'ACTIVE') throw new BadRequestException("O'quvchi bu guruhda allaqachon mavjud");
    if (already?.status === 'INACTIVE') {
      const studentGroup = await this.prisma.studentGroup.update({
        where: { groupId_studentId: { groupId, studentId: dto.studentId } },
        data: { status: 'ACTIVE' },
        select: {
          id: true,
          status: true,
          student: { select: { id: true, fullName: true, email: true } },
        },
      });

      return { message: "O'quvchi guruhga qayta qo'shildi", studentGroup };
    }

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

  async addStudentsBulk(groupId: number, dto: AddStudentsDto) {
    const studentIds = [...new Set((dto.studentIds || []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    if (!studentIds.length) throw new BadRequestException("O'quvchi IDlari noto'g'ri");

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, capacity: true, roomId: true, status: true },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');
    if (group.status !== 'ACTIVE') throw new BadRequestException("Faol bo'lmagan guruhga o'quvchi qo'shib bo'lmaydi");

    const room = await this.prisma.room.findUnique({
      where: { id: group.roomId },
      select: { capacity: true },
    });
    const maxCapacity = room ? Math.min(group.capacity, room.capacity) : group.capacity;

    const currentCount = await this.prisma.studentGroup.count({ where: { groupId, status: 'ACTIVE' } });
    const freeSeats = Math.max(0, maxCapacity - currentCount);
    if (freeSeats <= 0) throw new BadRequestException("Xona sig'imi allaqachon to'lgan");

    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, status: true },
    });
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const notFound = studentIds.filter((id) => !studentMap.has(id));
    const inactiveStudents = studentIds.filter((id) => studentMap.get(id)?.status !== 'ACTIVE');
    const eligibleIds = studentIds.filter((id) => studentMap.get(id)?.status === 'ACTIVE');

    const existing = await this.prisma.studentGroup.findMany({
      where: { groupId, studentId: { in: eligibleIds } },
      select: { studentId: true, status: true },
    });
    const activeExistingIds = existing.filter((x) => x.status === 'ACTIVE').map((x) => x.studentId);
    const inactiveExistingIds = existing.filter((x) => x.status === 'INACTIVE').map((x) => x.studentId);

    const createIds = eligibleIds.filter((id) => !activeExistingIds.includes(id) && !inactiveExistingIds.includes(id));
    const reactivateIds = eligibleIds.filter((id) => inactiveExistingIds.includes(id));
    const totalToAdd = createIds.length + reactivateIds.length;

    if (totalToAdd <= 0) {
      throw new BadRequestException("Tanlangan o'quvchilarni guruhga qo'shib bo'lmadi");
    }
    if (totalToAdd > freeSeats) {
      throw new BadRequestException(`Xona sig'imi allaqachon to'lgan. Bo'sh joy: ${freeSeats}, qo'shmoqchi: ${totalToAdd}`);
    }

    if (reactivateIds.length) {
      await this.prisma.studentGroup.updateMany({
        where: { groupId, studentId: { in: reactivateIds } },
        data: { status: 'ACTIVE' },
      });
    }
    if (createIds.length) {
      await this.prisma.studentGroup.createMany({
        data: createIds.map((studentId) => ({ groupId, studentId })),
      });
    }

    return {
      message: `${totalToAdd} ta o'quvchi guruhga qo'shildi`,
      summary: {
        added: createIds.length,
        reactivated: reactivateIds.length,
        alreadyInGroup: activeExistingIds.length,
        inactiveStudents: inactiveStudents.length,
        notFound: notFound.length,
      },
    };
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
