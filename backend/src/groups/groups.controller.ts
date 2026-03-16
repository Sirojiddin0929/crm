import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddStudentDto } from './dto/add-student.dto';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiCookieAuth('access_token')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Yangi guruh qo'shish" })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Barcha guruhlarni ko'rish (teacherId bo'yicha filter qilish mumkin)" })
  @ApiQuery({ name: 'teacherId', required: false, type: Number })
  @ApiQuery({ name: 'courseId', required: false, type: Number })
  findAll(
    @Query('teacherId') teacherId?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.groupsService.findAll(
      teacherId ? +teacherId : undefined,
      courseId ? +courseId : undefined,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Guruhni ID bo'yicha ko'rish (o'quvchilar bilan)" })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Get(':id/students')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Guruhdagi o'quvchilar ro'yxati" })
  getStudents(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.getStudents(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "Guruh ma'lumotlarini yangilash" })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Post(':id/students')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "Guruhga o'quvchi qo'shish" })
  addStudent(@Param('id', ParseIntPipe) id: number, @Body() dto: AddStudentDto) {
    return this.groupsService.addStudent(id, dto);
  }

  @Delete(':id/students/:studentId')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "Guruhdan o'quvchini chiqarish" })
  removeStudent(
    @Param('id', ParseIntPipe) id: number,
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    return this.groupsService.removeStudent(id, studentId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Guruhni o'chirish (INACTIVE ga o'tadi)" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.remove(id);
  }
}
