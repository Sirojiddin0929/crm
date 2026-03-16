import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, Status } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: "Web dasturlash" })
  @IsString()
  name: string;

  @ApiProperty({ example: 6, description: "Kurs davomiyligi (oy)" })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMonth: number;

  @ApiProperty({ example: 90, description: "Dars davomiyligi (daqiqa)" })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationLesson: number;

  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  @IsEnum(Status)
  status: Status;

  @ApiPropertyOptional({ enum: CourseLevel, example: CourseLevel.BEGINNER })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiProperty({ example: 500000, description: "Kurs narxi (so'm)" })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: "Kurs haqida batafsil ma'lumot" })
  @IsOptional()
  @IsString()
  description?: string;
}
