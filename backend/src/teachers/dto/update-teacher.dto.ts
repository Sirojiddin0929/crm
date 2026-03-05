import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import {IsEnum,IsInt,IsOptional,IsString,Min,} from 'class-validator';

export class UpdateTeacherDto {
  @ApiProperty({ example: 'Jasur Toshmatov', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'Senior Developer', required: false })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  experience?: number;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
