import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateHomeworkResponseDto {
  @ApiProperty({ example: 1, description: "Vazifa ID" })
  @IsInt()
  @Type(() => Number)
  homeworkId: number;

  @ApiPropertyOptional({ example: 1, description: "O'quvchi ID (student bo'lsa tokendan olinadi)" })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  studentId?: number;

  @ApiPropertyOptional({ example: "Mening yechimim" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: "https://github.com/user/repo" })
  @IsOptional()
  @IsString()
  url?: string;
}
