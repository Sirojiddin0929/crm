import {
  Body,
  Req,
  Res,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiCookieAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { multerConfig } from '../common/upload/multer.config';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentsService } from './students.service';
import { LoginDto } from 'src/auth/dto/login.dto';
import { ForgotPasswordDto } from 'src/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';

@ApiTags('Students')
@Controller('students')
@ApiCookieAuth('access_token')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "Yangi o'quvchi qo'shish" })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Post('login')
  @ApiOperation({summary:'Login - email va parol bilan kirish'})
  async login(@Body() dto:LoginDto, @Res({passthrough:true}) res:Response){
    const result = await this.studentsService.login(dto)
    
    res.cookie('access_token',result.access_token,{
      httpOnly:true,
      sameSite:'lax',
      path:'/',
      maxAge:7*24*60*60*1000
    })

    return result
  }

  @Post('forgot-password')
  @ApiOperation({summary:"Parol tiklash uchun emailga havola yuborish"})
  forgotPassword(@Body() dto:ForgotPasswordDto){
    return this.studentsService.forgotPassword(dto)
  }

  @Post('reset-password')
  @ApiOperation({summary:'Token orqali yangi parol ornatish'})
  resetPassword(@Body() dto:ResetPasswordDto){
    return this.studentsService.resetPassword(dto)
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({summary:'Tizimga kirgan holda eski parolni yangilash'})
  changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
    const { sub, type } = (req as any).user as { sub: number; type: string };
    return this.studentsService.changePassword(sub, type, dto);
  }
  

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "Barcha o'quvchilarni ko'rish" })
  findAll() {
    return this.studentsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "O'quvchini ID bo'yicha ko'rish (guruhlari bilan)" })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.STUDENT)
  @ApiOperation({ summary: "O'quvchining guruhlari" })
  getGroups(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.getGroups(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.STUDENT)
  @ApiOperation({ summary: "O'quvchi ma'lumotlarini yangilash" })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, dto);
  }

  @Patch(':id/photo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN,Role.STUDENT)
  @UseInterceptors(FileInterceptor('photo', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { photo: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: "O'quvchi rasmini yuklash" })
  uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.studentsService.updatePhoto(id, file.filename);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "O'quvchini o'chirish (status INACTIVE ga o'tadi)" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.studentsService.remove(id);
  }
}
