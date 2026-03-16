import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 1, description: "Guruh ID" })
  @IsInt()
  @Type(() => Number)
  groupId: number;

  @ApiProperty({ example: "HTML asoslari - 1-dars" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: "2026-03-10" })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: "Dars haqida qisqacha tavsif" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, description: "Admin (User) ID" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;

  @ApiPropertyOptional({ example: 1, description: "O'qituvchi ID" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  teacherId?: number;
}
