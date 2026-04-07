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
import { HomeworkResultsService } from './homework-results.service';
import { CreateHomeworkResultDto } from './dto/create-homework-result.dto';
import { UpdateHomeworkResultDto } from './dto/update-homework-result.dto';

@ApiTags('Homework Results')
@Controller('homework-results')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiCookieAuth('access_token')
export class HomeworkResultsController {
  constructor(private readonly homeworkResultsService: HomeworkResultsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @ApiOperation({ summary: "Vazifani baholash (o'qituvchi tomonidan)" })
  create(@Body() dto: CreateHomeworkResultDto) {
    return this.homeworkResultsService.create(dto);
  }

  @Patch(':id/file')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @UseInterceptors(FileInterceptor('file', documentMulterConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: "Baholashga fayl yuklash" })
  uploadFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.homeworkResultsService.uploadFile(id, file.filename);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Barcha baholashlarni ko'rish (homeworkId/studentId bo'yicha filter qilish mumkin)" })
  @ApiQuery({ name: 'homeworkId', required: false, type: Number })
  @ApiQuery({ name: 'studentId', required: false, type: Number })
  findAll(@Query('homeworkId') homeworkId?: string, @Query('studentId') studentId?: string) {
    return this.homeworkResultsService.findAll(homeworkId ? +homeworkId : undefined, studentId ? +studentId : undefined);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER, Role.STUDENT)
  @ApiOperation({ summary: "Baholashni ID bo'yicha ko'rish" })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkResultsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.MANAGEMENT, Role.ADMINSTRATOR, Role.TEACHER)
  @ApiOperation({ summary: "Baholashni yangilash" })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateHomeworkResultDto) {
    return this.homeworkResultsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: "Baholashni o'chirish" })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.homeworkResultsService.remove(id);
  }
}
