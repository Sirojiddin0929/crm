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
import { documentMulterConfig } from '../common/upload/multer.config';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { HomeworkResponsesService } from './homework-responses.service';
import { CreateHomeworkResponseDto } from './dto/create-homework-response.dto';
import { UpdateHomeworkResponseDto } from './dto/update-homework-response.dto';

@ApiTags('Homework Responses')
@Controller('homework-responses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiCookieAuth('access_token')
export class HomeworkResponsesController {
  constructor(private readonly homeworkResponsesService: HomeworkResponsesService) {}

  @Post()
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @ApiOperation({ summary: "Vazifaga javob qo'shish (o'quvchi tomonidan)" })
  create(@Body() dto: CreateHomeworkResponseDto) {
    return this.homeworkResponsesService.create(dto);
  }

  @Patch(':id/file')
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @UseInterceptors(FileInterceptor('file', documentMulterConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: "Javobga fayl yuklash" })
  uploadFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.homeworkResponsesService.uploadFile(id, file.filename);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Barcha javoblarni ko'rish (homeworkId/studentId bo'yicha filter qilish mumkin)" })
  @ApiQuery({ name: 'homeworkId', required: false, type: Number })
  @ApiQuery({ name: 'studentId', required: false, type: Number })
  findAll(@Query('homeworkId') homeworkId?: string, @Query('studentId') studentId?: string) {
    return this.homeworkResponsesService.findAll(homeworkId ? +homeworkId : undefined, studentId ? +studentId : undefined);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Javobni ID bo'yicha ko'rish" })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkResponsesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @ApiOperation({ summary: "Javobni yangilash" })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHomeworkResponseDto) {
    return this.homeworkResponsesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Javobni o'chirish" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkResponsesService.remove(id);
  }
}
