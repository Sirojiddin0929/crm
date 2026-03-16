  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { Type } from 'class-transformer';
  import { IsInt, IsOptional, IsString, Min } from 'class-validator';

  export class CreateHomeworkDto {
    @ApiProperty({ example: 1, description: "Dars ID" })
    @IsInt()
    @Type(() => Number)
    lessonId: number;

    @ApiProperty({ example: "HTML layout vazifasi" })
    @IsString()
    title: string;

    @ApiPropertyOptional({ example: 16, description: "Topshirish muddati (soat)" })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    durationTime?: number;

    @ApiPropertyOptional({ example: 1, description: "Admin (User) ID" })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    userId?: number;

    @ApiPropertyOptional({ example: 1, description: "O'qituvchi ID" })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    teacherId?: number;
  }
