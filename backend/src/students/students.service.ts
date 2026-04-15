  import {BadRequestException,Injectable,NotFoundException, UnauthorizedException,} from '@nestjs/common';
  import * as bcrypt from 'bcrypt';
  import { MailService } from '../mail/mail.service';
  import { PrismaService } from '../prisma/prisma.service';
  import { CreateStudentDto } from './dto/create-student.dto';
  import { UpdateStudentDto } from './dto/update-student.dto';
  import { LoginDto } from 'src/auth/dto/login.dto';
  import { JwtService } from '@nestjs/jwt';
  import { ForgotPasswordDto } from 'src/auth/dto/forgot-password.dto';
  import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
  import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';

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
  const SELECT_STUDENT_COMPACT = {
    id: true,
    fullName: true,
    email: true,
    photo: true,
    status: true,
    created_at: true,
  };

  @Injectable()
  export class StudentsService {
    constructor(
      private prisma: PrismaService,
      private mail: MailService,
      private jwt:JwtService
    ) {}

    private buildPagination(page?: number, limit?: number) {
      const safePage = Number.isFinite(page) && page && page > 0 ? Math.floor(page) : 1;
      const safeLimit = Number.isFinite(limit) && limit && limit > 0 ? Math.min(Math.floor(limit), 100) : 10;
      return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
    }

    private buildWhere(search?: string, status?: string) {
      const q = search?.trim();
      const normalizedStatus = status?.toUpperCase();
      const where: any = {};

      if (q) {
        where.OR = [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (normalizedStatus && ['ACTIVE', 'INACTIVE', 'FREEZE'].includes(normalizedStatus)) {
        where.status = normalizedStatus;
      }

      return where;
    }

    
    async create(dto: CreateStudentDto) {
      const exists = await this.prisma.student.findUnique({
        where: { email: dto.email },
      });
      if (exists) {
        throw new BadRequestException("Bu email allaqachon ro'yxatdan o'tgan");
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const student = await this.prisma.student.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          birth_date: new Date(dto.birth_date),
          password: hashedPassword,
        },
        select: SELECT_STUDENT,
      });

      return {
        message: `O'quvchi qo'shildi.`,
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
          photo: student.photo,
          role:'STUDENT',
          status:student.status
        }
      }
    }

    
    async findAll(params?: { page?: number; limit?: number; search?: string; status?: string; compact?: boolean }) {
      const { page, limit, search, status, compact } = params || {};
      const usePagination = page !== undefined || limit !== undefined || !!search || !!status;
      const where = this.buildWhere(search, status);

      if (!usePagination) {
        return this.prisma.student.findMany({
          select: compact
            ? SELECT_STUDENT_COMPACT
            : {
                ...SELECT_STUDENT,
                StudentGroups: {
                  select: {
                    status: true,
                    group: {
                      select: {
                        id: true,
                        name: true,
                        status: true,
                      },
                    },
                  },
                },
              },
          orderBy: { created_at: 'desc' },
        });
      }

      const { page: safePage, limit: safeLimit, skip } = this.buildPagination(page, limit);
      const [total, data] = await Promise.all([
        this.prisma.student.count({ where }),
        this.prisma.student.findMany({
          where,
          skip,
          take: safeLimit,
          select: compact
            ? SELECT_STUDENT_COMPACT
            : {
                ...SELECT_STUDENT,
                StudentGroups: {
                  select: {
                    status: true,
                    group: {
                      select: {
                        id: true,
                        name: true,
                        status: true,
                      },
                    },
                  },
                },
              },
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

    async getSummary() {
      const [total, linkedStudents, active, inactive, freeze] = await Promise.all([
        this.prisma.student.count(),
        this.prisma.studentGroup.findMany({
          distinct: ['studentId'],
          select: { studentId: true },
        }),
        this.prisma.student.count({ where: { status: 'ACTIVE' } }),
        this.prisma.student.count({ where: { status: 'INACTIVE' } }),
        this.prisma.student.count({ where: { status: 'FREEZE' } }),
      ]);

      return {
        total,
        withGroups: linkedStudents.length,
        withoutGroups: Math.max(0, total - linkedStudents.length),
        byStatus: {
          ACTIVE: active,
          INACTIVE: inactive,
          FREEZE: freeze,
        },
      };
    }

    async getSearchSummary(params?: { search?: string; status?: string; page?: number; limit?: number }) {
      const where = this.buildWhere(params?.search, params?.status);
      const { page, limit, skip } = this.buildPagination(params?.page, params?.limit);

      const [total, active, inactive, freeze, items] = await Promise.all([
        this.prisma.student.count({ where }),
        this.prisma.student.count({ where: { ...where, status: 'ACTIVE' } }),
        this.prisma.student.count({ where: { ...where, status: 'INACTIVE' } }),
        this.prisma.student.count({ where: { ...where, status: 'FREEZE' } }),
        this.prisma.student.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          select: {
            ...SELECT_STUDENT,
            StudentGroups: {
              select: {
                status: true,
                group: { select: { id: true, name: true, status: true } },
              },
            },
          },
        }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));
      return {
        summary: {
          query: params?.search?.trim() || '',
          total,
          byStatus: {
            ACTIVE: active,
            INACTIVE: inactive,
            FREEZE: freeze,
          },
        },
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
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
              user: { select: { id: true, fullName: true, role: true } },
            },
          },
        },
      });
    }

    async updatePhoto(id: number, filename: string) {
      await this.findOne(id);
      const Url = process.env.APP_URL ?? 'http://localhost:4000';

      const student = await this.prisma.student.update({
        where: { id },
        data: { photo: `${Url}/uploads/${filename}` },
        select: { id: true, fullName: true, photo: true },
      });

      const baseUrl = process.env.APP_URL ?? 'http://localhost:4000';
      return {
        message: 'Rasm muvaffaqiyatli yuklandi',
        photo: `${baseUrl}/uploads/${filename}`,
        student,
      };
    }
    async forgotPassword(dto:ForgotPasswordDto){
      const SAME_MSG="Agar email mavjud bo'lsa ,tiklash havolasi yuboriladi"

      const student = await this.prisma.student.findUnique({where:{email:dto.email}})
      if(student){
        const resetToken= await this.jwt.signAsync(
          {sub: student?.id,email:student?.email,type:'student',purpose:'reset'},
          {expiresIn:'15m'}
        )
        await this.mail.sendResetPasswordEmail(student.email,student.fullName,resetToken)
        return {message:SAME_MSG}
      }
    }
    async resetPassword(dto:ResetPasswordDto){
      let payload:{
        sub:number,
        email:string,
        type:string,
        purpose:string
      }
      try {
        payload = await this.jwt.verifyAsync(dto.token)
      } catch{
        throw new BadRequestException("Token yaroqsiz yoki muddati o'tgan")
      }

      if(payload.purpose !== 'reset'){
        throw new BadRequestException("Token yaroqsiz")
      }

      const hashed = await bcrypt.hash(dto.newPassword,10)

      if(payload.type === 'student'){
        await this.prisma.student.update({
          where:{id:payload.sub},
          data:{password:hashed}
        })
      }

      return {message:'Parol muvaffaqiyatli yangilandi'}
    }
    async changePassword(userId:number,userType:string,dto:ChangePasswordDto){
      const isStudent = userType === 'student'
      
      let record
      if(isStudent){
        record = await this.prisma.student.findUnique({where:{id:userId}})
      }

      if(!record){
        throw new NotFoundException("Student topilmadi")
      }

      const isMatch = await bcrypt.compare(dto.oldPassword,record.password)
      if(!isMatch){
        throw new UnauthorizedException("Eski parol notogri")
      }

      if(dto.oldPassword === dto.newPassword){
        throw new BadRequestException("Yangi parol eski parol bilan bir xil")
      }

      const hashed = await bcrypt.hash(dto.newPassword,10)

      if(isStudent){
        await this.prisma.student.update({where:{id:userId},data:{password:hashed}})
      }

      return {message:"Parol muvaffaqiyatli yangilandi"}

    }
  }
