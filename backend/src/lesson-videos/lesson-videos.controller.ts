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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiCookieAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { videoMulterConfig } from '../common/upload/multer.config';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LessonVideosService } from './lesson-videos.service';
import { CreateLessonVideoDto } from './dto/create-lesson-video.dto';
import { UpdateLessonVideoDto } from './dto/update-lesson-video.dto';

@ApiTags('Lesson Videos')
@Controller('lesson-videos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiCookieAuth('access_token')
export class LessonVideosController {
  constructor(private readonly lessonVideosService: LessonVideosService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @UseInterceptors(FileInterceptor('file', videoMulterConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lessonId: { type: 'integer' },
        title: { type: 'string' },
        userId: { type: 'integer' },
        teacherId: { type: 'integer' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['lessonId', 'file'],
    },
  })
  @ApiOperation({ summary: "Darsga video qo'shish" })
  create(
    @Body() dto: CreateLessonVideoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.lessonVideosService.create(dto, file?.filename,file?.size);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Barcha videolarni ko'rish (lessonId/groupId/teacherId bo'yicha filter qilish mumkin)" })
  @ApiQuery({ name: 'lessonId', required: false, type: Number })
  @ApiQuery({ name: 'groupId', required: false, type: Number })
  @ApiQuery({ name: 'courseId', required: false, type: Number })
  @ApiQuery({ name: 'teacherId', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('lessonId') lessonId?: string,
    @Query('groupId') groupId?: string,
    @Query('courseId') courseId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.lessonVideosService.findAll({
      lessonId: lessonId ? +lessonId : undefined,
      groupId: groupId ? +groupId : undefined,
      courseId: courseId ? +courseId : undefined,
      teacherId: teacherId ? +teacherId : undefined,
      search,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Videoni ID bo'yicha ko'rish" })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonVideosService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @UseInterceptors(FileInterceptor('file', videoMulterConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lessonId: { type: 'integer' },
        title: { type: 'string' },
        userId: { type: 'integer' },
        teacherId: { type: 'integer' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: "Video ma'lumotlarini yangilash (sarlavha)" })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLessonVideoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.lessonVideosService.update(id, dto, file?.filename, file?.size);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Videoni o'chirish" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lessonVideosService.remove(id);
  }
}
