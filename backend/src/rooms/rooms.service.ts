import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoomDto) {
    const exists = await this.prisma.room.findUnique({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Bu nomdagi xona allaqachon mavjud');

    const room = await this.prisma.room.create({ data: { ...dto } });
    return { message: "Xona qo'shildi", room };
  }

  async findAll() {
    return this.prisma.room.findMany({
      include: { _count: { select: { groups: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { _count: { select: { groups: true } } },
    });
    if (!room) throw new NotFoundException(`ID: ${id} bo'yicha xona topilmadi`);
    return room;
  }

  async update(id: number, dto: UpdateRoomDto) {
    await this.findOne(id);
    const room = await this.prisma.room.update({ where: { id }, data: { ...dto } });
    return { message: "Xona ma'lumotlari yangilandi", room };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.room.update({ where: { id }, data: { status: 'INACTIVE' } });
    return { message: `Xona (ID: ${id}) o'chirildi` };
  }
}
