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

  @ApiPropertyOptional({ example: 5, description: "XP avtomatik hisoblanadi (0-59:0, 60-69:2, 70-89:4, 90-100:6). Yuborilgan qiymat e'tiborga olinmaydi." })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  xp?: number;

  @ApiPropertyOptional({ example: 50, description: "Kumush (Coins) avtomatik: coin = xp * 10. Yuborilgan qiymat e'tiborga olinmaydi." })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  coin?: number;
}
