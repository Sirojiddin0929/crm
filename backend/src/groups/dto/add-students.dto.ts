import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class AddStudentsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: "Guruhga qo'shiladigan o'quvchilar ID ro'yxati",
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  studentIds: number[];
}

