import { ApiPropertyOptional } from '@nestjs/swagger';
import { HomeworkStatusStudent } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateHomeworkResponseDto } from './create-homework-response.dto';

export class UpdateHomeworkResponseDto extends PartialType(CreateHomeworkResponseDto) {
  @ApiPropertyOptional({ enum: HomeworkStatusStudent })
  @IsOptional()
  @IsEnum(HomeworkStatusStudent)
  status?: HomeworkStatusStudent;
}
