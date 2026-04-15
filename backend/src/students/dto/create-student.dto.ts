import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Sardor Eshmatov' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'sardor@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '2005-06-15', description: 'Tug\'ilgan sana' })
  @IsDateString()
  birth_date: string;

  @ApiProperty({ example: 'StrongPass123', description: 'Admin tomonidan beriladigan parol' })
  @IsString()
  @MinLength(6)
  password: string;
}
