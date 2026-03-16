import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ example: 1, description: "O'qituvchi ID" })
  @IsInt()
  @Type(() => Number)
  teacherId: number;

  @ApiProperty({ example: 1, description: "Dars ID" })
  @IsInt()
  @Type(() => Number)
  lessonId: number;

  @ApiProperty({ example: 1, description: "O'quvchi ID (ixtiyoriy)", required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  studentId?: number;

  @ApiProperty({ example: 4.5, description: "Ball (1-5, 0.5 qadamda)" })
  @IsNumber()
  @Min(0.5)
  @Max(5)
  @Type(() => Number)
  score: number;

  @ApiProperty({ example: 'Yaxshi dars berdi', description: 'Izoh', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
