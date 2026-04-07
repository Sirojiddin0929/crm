import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateHomeworkResultDto {
  @ApiProperty({ example: 1, description: "Vazifa ID" })
  @IsInt()
  @Type(() => Number)
  homeworkId: number;

  @ApiProperty({ example: 1, description: "O'quvchi ID" })
  @IsInt()
  @Type(() => Number)
  studentId: number;

  @ApiProperty({ example: 85, description: "Ball (0-100)" })
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  score: number;

  @ApiPropertyOptional({ example: "Yaxshi ishlangan" })
  @IsOptional()
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

  @ApiProperty({ example: 5, description: "XP ball" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  xp?: number;

  @ApiProperty({ example: 10, description: "Kumush (Coins)" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  coin?: number;
}
