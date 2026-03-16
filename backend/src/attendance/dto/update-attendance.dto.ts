import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAttendanceDto {
  @ApiProperty({ example: true, description: "Davomatda bormi?" })
  @IsBoolean()
  isPresent: boolean;
}
