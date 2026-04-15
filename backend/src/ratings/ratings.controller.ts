import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@ApiTags('Ratings')
@Controller('ratings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiCookieAuth('access_token')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "O'qituvchiga reyting berish" })
  create(@Body() dto: CreateRatingDto) {
    return this.ratingsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "Barcha reytinglarni ko'rish" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'teacherId', required: false, type: Number })
  @ApiQuery({ name: 'lessonId', required: false, type: Number })
  @ApiQuery({ name: 'studentId', required: false, type: Number })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('teacherId') teacherId?: string,
    @Query('lessonId') lessonId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.ratingsService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
      teacherId: teacherId ? +teacherId : undefined,
      lessonId: lessonId ? +lessonId : undefined,
      studentId: studentId ? +studentId : undefined,
    });
  }

  @Get('student/:studentId')
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "O'quvchi bergan reytinglarni ko'rish" })
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.ratingsService.findByStudent(studentId);
  }

  @Get('teacher/:teacherId')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR)
  @ApiOperation({ summary: "O'qituvchi bo'yicha reytinglarni ko'rish (faqat adminlar uchun)" })
  findByTeacher(@Param('teacherId', ParseIntPipe) teacherId: number) {
    return this.ratingsService.findByTeacher(teacherId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Reytingni o'chirish" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ratingsService.remove(id);
  }
}
