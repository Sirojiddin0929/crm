import {BadRequestException,Injectable,NotFoundException, UnauthorizedException,} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { JwtService } from '@nestjs/jwt';

const SELECT_STUDENT = {
  id: true,
  fullName: true,
  email: true,
  photo: true,
  birth_date: true,
  status: true,
  created_at: true,
  updated_at: true,
};

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private jwt:JwtService
  ) {}

  private generatePassword(length = 12): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const symbols = '!@#$%^&*()-_=+';
    const all = upper + lower + digits + symbols;

    const password =
      upper[Math.floor(Math.random() * upper.length)] +
      lower[Math.floor(Math.random() * lower.length)] +
      digits[Math.floor(Math.random() * digits.length)] +
      symbols[Math.floor(Math.random() * symbols.length)] +
      Array.from({ length: length - 4 }, () =>
        all[Math.floor(Math.random() * all.length)],
      ).join('');

    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  
  async create(dto: CreateStudentDto) {
    const exists = await this.prisma.student.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException("Bu email allaqachon ro'yxatdan o'tgan");
    }

    const plainPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const student = await this.prisma.student.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        birth_date: new Date(dto.birth_date),
        password: hashedPassword,
      },
      select: SELECT_STUDENT,
    });

    await this.mail.sendCredentials(dto.email, dto.fullName, plainPassword);

    return {
      message: `O'quvchi qo'shildi. Login va parol ${dto.email} manziliga yuborildi.`,
      student,
    };
  }

  async login (dto:LoginDto){
    const student = await this.prisma.student.findUnique({
      where:{email:dto.email}
    })
    if(!student){
      throw new UnauthorizedException("Email yoki password xato")
    }

    const isMatchStudent = await bcrypt.compare(dto.password,student.password)
    if(!isMatchStudent){
      throw new UnauthorizedException("Email yoki password xato")
    }

    const studentToken = await this.jwt.signAsync({
      sub:student.id,
      email:student.email,
      role:'STUDENT',
      type:'student'
    })

    return {
      access_token:studentToken,
      type:'student',
      user:{
        id:student.id,
        fullName:student.fullName,
        email:student.email,
        role:'STUDENT',
        status:student.status
      }
    }
  }

  
  async findAll() {
    return this.prisma.student.findMany({
      select: SELECT_STUDENT,
      orderBy: { created_at: 'desc' },
    });
  }

 
  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        ...SELECT_STUDENT,
        StudentGroups: {
          select: {
            status: true,
            group: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
                startTime: true,
                weekDays: true,
                course: { select: { id: true, name: true, level: true } },
                teacher: { select: { id: true, fullName: true } },
                room: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`ID: ${id} bo'yicha o'quvchi topilmadi`);
    }

    return student;
  }

  
  async update(id: number, dto: UpdateStudentDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.birth_date) {
      data.birth_date = new Date(dto.birth_date);
    }

    const student = await this.prisma.student.update({
      where: { id },
      data,
      select: SELECT_STUDENT,
    });

    return { message: "O'quvchi ma'lumotlari yangilandi", student };
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.student.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return { message: `O'quvchi (ID: ${id}) o'chirildi` };
  }

  async getGroups(id: number) {
    await this.findOne(id);

    return this.prisma.studentGroup.findMany({
      where: { studentId: id },
      select: {
        id: true,
        status: true,
        group: {
          select: {
            id: true,
            name: true,
            status: true,
            capacity: true,
            startDate: true,
            startTime: true,
            weekDays: true,
            course: { select: { id: true, name: true, level: true } },
            teacher: { select: { id: true, fullName: true } },
            room: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async updatePhoto(id: number, filename: string) {
    await this.findOne(id);

    const student = await this.prisma.student.update({
      where: { id },
      data: { photo: `http://localhost:4000/uploads/${filename}` },
      select: { id: true, fullName: true, photo: true },
    });

    const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
    return {
      message: 'Rasm muvaffaqiyatli yuklandi',
      photo: `${baseUrl}/uploads/${filename}`,
      student,
    };
  }
}
