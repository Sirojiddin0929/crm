import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class CreateAttendanceDto {
  @ApiProperty({ example: 1, description: "Dars ID" })
  @IsInt()
  @Type(() => Number)
  lessonId: number;

  @ApiProperty({ example: 1, description: "O'quvchi ID" })
  @IsInt()
  @Type(() => Number)
  studentId: number;

  @ApiProperty({ example: true, description: "Davomatda bormi?" })
  @IsBoolean()
  isPresent: boolean;

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
