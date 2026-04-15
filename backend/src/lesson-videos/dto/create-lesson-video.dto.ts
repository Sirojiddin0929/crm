import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateLessonVideoDto {
  @ApiProperty({ example: 1, description: "Dars ID" })
  @IsInt()
  @Type(() => Number)
  lessonId: number;

  @ApiPropertyOptional({ example: "HTML asoslari - 1-dars video" })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return String(value).trim();
  })
  @IsString()
  title?: string;

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
