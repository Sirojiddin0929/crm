import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { BulkCreateAttendanceDto } from './dto/bulk-create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiCookieAuth('access_token')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @ApiOperation({ summary: "Bitta davomat yozuvi qo'shish" })
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @ApiOperation({ summary: "Barcha davomat yozuvlarini ko'rish" })
  findAll() {
    return this.attendanceService.findAll();
  }

  @Post('bulk')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @ApiOperation({ summary: "Bir dars uchun barcha o'quvchilarning davomatini bir vaqtda yuborish" })
  bulkCreate(@Body() dto: BulkCreateAttendanceDto) {
    return this.attendanceService.bulkCreate(dto);
  }

  @Get('lesson/:lessonId')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @ApiOperation({ summary: "Dars bo'yicha davomatni ko'rish" })
  findByLesson(@Param('lessonId', ParseIntPipe) lessonId: number) {
    return this.attendanceService.findByLesson(lessonId);
  }

  @Get('student/:studentId')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "O'quvchi bo'yicha barcha davomatni ko'rish" })
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.attendanceService.findByStudent(studentId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @ApiOperation({ summary: "Davomatni yangilash" })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(id, dto);
  }
}
