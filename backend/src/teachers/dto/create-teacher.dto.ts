import { ApiProperty } from '@nestjs/swagger';

import {IsEmail,IsInt,IsNotEmpty,IsString,Min,} from 'class-validator';

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

  

}
