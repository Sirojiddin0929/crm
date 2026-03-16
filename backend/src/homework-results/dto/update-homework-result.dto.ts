import { PartialType } from '@nestjs/swagger';
import { CreateHomeworkResultDto } from './create-homework-result.dto';

export class UpdateHomeworkResultDto extends PartialType(CreateHomeworkResultDto) {}
