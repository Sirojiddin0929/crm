import { ApiProperty } from '@nestjs/swagger';

import {IsEmail,IsInt,IsNotEmpty,IsString,Min, MinLength,} from 'class-validator';

export class CreateTeacherDto {
  @ApiProperty({ example: 'Jasur Toshmatov' })
  @IsString()
  @IsNotEmpty({message:'Kirib ket'})
  fullName: string;

  @ApiProperty({ example: 'jasur@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Backend Developer' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({ example: 3, description: 'Tajriba yillari' })
  @IsInt()
  @Min(0)
  experience: number;

  @ApiProperty({ example: 'StrongPass123', description: 'Admin tomonidan beriladigan parol' })
  @IsString()
  @MinLength(6)
  password: string;

}
