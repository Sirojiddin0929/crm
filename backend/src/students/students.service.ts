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
          photo: student.photo,
          role:'STUDENT',
          status:student.status
        }
      }
    }

    
    async findAll(){
      return this.prisma.student.findMany(({
        select:{
          ...SELECT_STUDENT,
          StudentGroups:{
            select:{
              status:true,
              group:{
                select:{
                  id:true,
                  name:true,
                  status:true
                },
              },
            },
          },
        },
        orderBy:{created_at:'desc'},
      }))
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
