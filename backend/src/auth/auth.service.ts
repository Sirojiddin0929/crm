import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  async login(dto: LoginDto) {
    
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      const isMatch = await bcrypt.compare(dto.password, user.password);
      if (!isMatch) {
        throw new UnauthorizedException("Email yoki parol noto'g'ri");
      }

      const token = await this.jwt.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'user',
      });

      return {
        access_token: token,
        type: 'user',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          photo: user.photo,
          role: user.role,
          status: user.status,
        },
      };
    }

    
    const teacher = await this.prisma.teacher.findUnique({
      where: { email: dto.email },
    });

    if (teacher) {
      const isMatch = await bcrypt.compare(dto.password, teacher.password);
      if (!isMatch) {
        throw new UnauthorizedException("Email yoki parol noto'g'ri");
      }

      const token = await this.jwt.signAsync({
        sub: teacher.id,
        email: teacher.email,
        role: 'TEACHER',
        type: 'teacher',
      });

      return {
        access_token: token,
        type: 'teacher',
        user: {
          id: teacher.id,
          fullName: teacher.fullName,
          email: teacher.email,
          photo: teacher.photo,
          role: 'TEACHER',
          status: teacher.status,
        },
      };
    }

    
    const student = await this.prisma.student.findUnique({
      where: { email: dto.email },
    });

    if (!student) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    const isMatchStudent = await bcrypt.compare(dto.password, student.password);
    if (!isMatchStudent) {
      throw new UnauthorizedException("Email yoki parol noto'g'ri");
    }

    const studentToken = await this.jwt.signAsync({
      sub: student.id,
      email: student.email,
      role: 'STUDENT',
      type: 'student',
    });

    return {
      access_token: studentToken,
      type: 'student',
      user: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        photo: student.photo,
        xp: student.xp,
        coin: student.coin,
        role: 'STUDENT',
        status: student.status,
      },
    };
  }

  
  async forgotPassword(dto: ForgotPasswordDto) {
    const SAME_MSG = "Agar email mavjud bo'lsa, tiklash havolasi yuborildi";

    
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      const resetToken = await this.jwt.signAsync(
        { sub: user.id, email: user.email, type: 'user', purpose: 'reset' },
        { expiresIn: '15m' },
      );
      await this.mail.sendResetPasswordEmail(user.email, user.fullName, resetToken);
      return { message: SAME_MSG };
    }

    
    const teacher = await this.prisma.teacher.findUnique({ where: { email: dto.email } });
    if (teacher) {
      const resetToken = await this.jwt.signAsync(
        { sub: teacher.id, email: teacher.email, type: 'teacher', purpose: 'reset' },
        { expiresIn: '15m' },
      );
      await this.mail.sendResetPasswordEmail(teacher.email, teacher.fullName, resetToken);
      return { message: SAME_MSG };
    }

   
    const student = await this.prisma.student.findUnique({ where: { email: dto.email } });
    if (student) {
      const resetToken = await this.jwt.signAsync(
        { sub: student.id, email: student.email, type: 'student', purpose: 'reset' },
        { expiresIn: '15m' },
      );
      await this.mail.sendResetPasswordEmail(student.email, student.fullName, resetToken);
      return { message: SAME_MSG };
    }

    return { message: SAME_MSG };
  }

  
  async resetPassword(dto: ResetPasswordDto) {
    let payload: { sub: number; email: string; type: string; purpose: string };

    try {
      payload = await this.jwt.verifyAsync(dto.token);
    } catch {
      throw new BadRequestException('Token yaroqsiz yoki muddati tugagan');
    }

    if (payload.purpose !== 'reset') {
      throw new BadRequestException('Token yaroqsiz');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    if (payload.type === 'teacher') {
      await this.prisma.teacher.update({
        where: { id: payload.sub },
        data: { password: hashed },
      });
    } else if (payload.type === 'student') {
      await this.prisma.student.update({
        where: { id: payload.sub },
        data: { password: hashed },
      });
    } else {
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashed },
      });
    }

    return { message: 'Parol muvaffaqiyatli yangilandi' };
  }

  async changePassword(
    userId: number,
    userType: string,
    dto: ChangePasswordDto,
  ) {
    const isTeacher = userType === 'teacher';
    const isStudent = userType === 'student';

    const record = isTeacher
      ? await this.prisma.teacher.findUnique({ where: { id: userId } })
      : isStudent
        ? await this.prisma.student.findUnique({ where: { id: userId } })
        : await this.prisma.user.findUnique({ where: { id: userId } });

    if (!record) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, record.password);
    if (!isMatch) {
      throw new UnauthorizedException("Eski parol noto'g'ri");
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException("Yangi parol eski paroldan farqli bo'lishi kerak");
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);

    if (isTeacher) {
      await this.prisma.teacher.update({ where: { id: userId }, data: { password: hashed } });
    } else if (isStudent) {
      await this.prisma.student.update({ where: { id: userId }, data: { password: hashed } });
    } else {
      await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    }

    return { message: "Parol muvaffaqiyatli o'zgartirildi" };
  }
}
