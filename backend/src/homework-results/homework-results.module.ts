import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { HomeworkResultsController } from './homework-results.controller';
import { HomeworkResultsService } from './homework-results.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HomeworkResultsController],
  providers: [HomeworkResultsService],
})
export class HomeworkResultsModule {}
