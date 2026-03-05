import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'password@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MyP@ssw0rd!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
