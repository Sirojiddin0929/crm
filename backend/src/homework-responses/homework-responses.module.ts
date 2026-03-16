import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { HomeworkResponsesController } from './homework-responses.controller';
import { HomeworkResponsesService } from './homework-responses.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HomeworkResponsesController],
  providers: [HomeworkResponsesService],
})
export class HomeworkResponsesModule {}
