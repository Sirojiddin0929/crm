-- CreateIndex
CREATE INDEX "Attendance_lessonId_studentId_idx" ON "Attendance"("lessonId", "studentId");

-- CreateIndex
CREATE INDEX "Attendance_studentId_created_at_idx" ON "Attendance"("studentId", "created_at");

-- CreateIndex
CREATE INDEX "Course_status_created_at_idx" ON "Course"("status", "created_at");

-- CreateIndex
CREATE INDEX "Group_teacherId_status_created_at_idx" ON "Group"("teacherId", "status", "created_at");

-- CreateIndex
CREATE INDEX "Group_courseId_status_created_at_idx" ON "Group"("courseId", "status", "created_at");

-- CreateIndex
CREATE INDEX "Group_roomId_status_idx" ON "Group"("roomId", "status");

-- CreateIndex
CREATE INDEX "Homework_lessonId_created_at_idx" ON "Homework"("lessonId", "created_at");

-- CreateIndex
CREATE INDEX "Homework_teacherId_created_at_idx" ON "Homework"("teacherId", "created_at");

-- CreateIndex
CREATE INDEX "HomeworkResponse_homeworkId_studentId_idx" ON "HomeworkResponse"("homeworkId", "studentId");

-- CreateIndex
CREATE INDEX "HomeworkResponse_studentId_created_at_idx" ON "HomeworkResponse"("studentId", "created_at");

-- CreateIndex
CREATE INDEX "HomeworkResult_homeworkId_studentId_created_at_idx" ON "HomeworkResult"("homeworkId", "studentId", "created_at");

-- CreateIndex
CREATE INDEX "HomeworkResult_studentId_created_at_idx" ON "HomeworkResult"("studentId", "created_at");

-- CreateIndex
CREATE INDEX "Lesson_groupId_created_at_idx" ON "Lesson"("groupId", "created_at");

-- CreateIndex
CREATE INDEX "Lesson_teacherId_created_at_idx" ON "Lesson"("teacherId", "created_at");

-- CreateIndex
CREATE INDEX "LessonVideo_lessonId_created_at_idx" ON "LessonVideo"("lessonId", "created_at");

-- CreateIndex
CREATE INDEX "LessonVideo_teacherId_created_at_idx" ON "LessonVideo"("teacherId", "created_at");

-- CreateIndex
CREATE INDEX "Product_status_created_at_idx" ON "Product"("status", "created_at");

-- CreateIndex
CREATE INDEX "Rating_teacherId_created_at_idx" ON "Rating"("teacherId", "created_at");

-- CreateIndex
CREATE INDEX "Rating_lessonId_created_at_idx" ON "Rating"("lessonId", "created_at");

-- CreateIndex
CREATE INDEX "Room_status_created_at_idx" ON "Room"("status", "created_at");

-- CreateIndex
CREATE INDEX "Student_status_created_at_idx" ON "Student"("status", "created_at");

-- CreateIndex
CREATE INDEX "StudentGroup_groupId_status_created_at_idx" ON "StudentGroup"("groupId", "status", "created_at");

-- CreateIndex
CREATE INDEX "StudentGroup_studentId_status_created_at_idx" ON "StudentGroup"("studentId", "status", "created_at");

-- CreateIndex
CREATE INDEX "Teacher_status_created_at_idx" ON "Teacher"("status", "created_at");

-- CreateIndex
CREATE INDEX "Teacher_position_idx" ON "Teacher"("position");

-- CreateIndex
CREATE INDEX "User_status_created_at_idx" ON "User"("status", "created_at");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
