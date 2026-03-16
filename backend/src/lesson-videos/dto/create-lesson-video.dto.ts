import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateLessonVideoDto {
  @ApiProperty({ example: 1, description: "Dars ID" })
  @IsInt()
  @Type(() => Number)
  lessonId: number;

  @ApiProperty({ example: "HTML asoslari - 1-dars video" })
  @IsString()
  title: string;

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
