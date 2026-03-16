import { ApiProperty } from '@nestjs/swagger';
import { WeekDays } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsString, Min } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 1, description: "O'qituvchi ID" })
  @IsInt()
  @Type(() => Number)
  teacherId: number;

  @ApiProperty({ example: 1, description: "Admin (User) ID" })
  @IsInt()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ example: 1, description: "Xona ID" })
  @IsInt()
  @Type(() => Number)
  roomId: number;

  @ApiProperty({ example: 1, description: "Kurs ID" })
  @IsInt()
  @Type(() => Number)
  courseId: number;

  @ApiProperty({ example: "WEB-G1" })
  @IsString()
  name: string;

  @ApiProperty({ example: 20, description: "Guruh sig'imi (kishi)" })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity: number;

  @ApiProperty({ example: "2026-03-15", description: "Boshlash sanasi" })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: "09:00", description: "Dars boshlanish vaqti (HH:mm)" })
  @IsString()
  startTime: string;

  @ApiProperty({ enum: WeekDays, isArray: true, example: [WeekDays.MONDAY, WeekDays.WEDNESDAY, WeekDays.FRIDAY] })
  @IsArray()
  @IsEnum(WeekDays, { each: true })
  weekDays: WeekDays[];
}
