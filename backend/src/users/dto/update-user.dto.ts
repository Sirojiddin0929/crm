import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';
import {IsDateString,IsEnum,IsOptional,IsString,} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'Ali Valiyev', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'Senior Manager', required: false })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  hire_date?: string;

  @ApiProperty({ enum: Role, required: false })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ example: 'Toshkent, Chilonzor', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
