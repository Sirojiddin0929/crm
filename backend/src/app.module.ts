import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TeachersModule } from './teachers/teachers.module';
import { StudentsModule } from './students/students.module';
import { CoursesModule } from './courses/courses.module';
import { RoomsModule } from './rooms/rooms.module';
import { GroupsModule } from './groups/groups.module';
import { LessonsModule } from './lessons/lessons.module';
import { AttendanceModule } from './attendance/attendance.module';
import { HomeworkModule } from './homework/homework.module';
import { LessonVideosModule } from './lesson-videos/lesson-videos.module';
import { HomeworkResponsesModule } from './homework-responses/homework-responses.module';
import { HomeworkResultsModule } from './homework-results/homework-results.module';
import { RatingsModule } from './ratings/ratings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    TeachersModule,
    StudentsModule,
    CoursesModule,
    RoomsModule,
    GroupsModule,
    LessonsModule,
    AttendanceModule,
    HomeworkModule,
    LessonVideosModule,
    HomeworkResponsesModule,
    HomeworkResultsModule,
    RatingsModule,
  ],
})
export class AppModule {}
