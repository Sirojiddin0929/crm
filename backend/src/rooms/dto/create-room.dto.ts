import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: "101-xona" })
  @IsString()
  name: string;

  @ApiProperty({ example: 20, description: "Xona sig'imi (kishi)" })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity: number;

  @ApiPropertyOptional({ enum: Status, example: Status.ACTIVE })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
