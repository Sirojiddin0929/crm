import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AddStudentDto {
  @ApiProperty({ example: 1, description: "O'quvchi ID" })
  @IsInt()
  @Type(() => Number)
  studentId: number;
}
