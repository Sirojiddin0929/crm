import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateStudentDto {
  @ApiProperty({ example: 'Sardor Rahimov', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: '2005-06-15', required: false })
  @IsDateString()
  @IsOptional()
  birth_date?: string;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
