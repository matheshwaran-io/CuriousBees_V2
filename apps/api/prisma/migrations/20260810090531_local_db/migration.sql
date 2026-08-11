/*
  Warnings:

  - The values [INSTITUTION_ADMIN] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `firebaseUid` on the `User` table. All the data in the column will be lost.
  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[clerkId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `facultyId` to the `Department` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING_SUPERVISOR_APPROVAL', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ThreadType" AS ENUM ('TEXT', 'RESEARCH_UPDATE', 'DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'PUBLICATION', 'ACHIEVEMENT', 'COLLABORATION_REQUEST');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('PDF', 'IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('INSTITUTE_ADMIN', 'RESEARCH_SUPERVISOR', 'RESEARCH_SCHOLAR');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'RESEARCH_SCHOLAR';
COMMIT;

-- DropIndex
DROP INDEX "CollaborationRequest_scholarId_opportunityId_key";

-- DropIndex
DROP INDEX "Department_name_key";

-- DropIndex
DROP INDEX "User_firebaseUid_key";

-- AlterTable
ALTER TABLE "CollaborationRequest" ADD COLUMN     "threadId" TEXT,
ALTER COLUMN "opportunityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "facultyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "isPaper" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paperJournal" TEXT,
ADD COLUMN     "type" "ThreadType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firebaseUid",
ADD COLUMN     "clerkId" TEXT,
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "faculty" TEXT,
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "SystemAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "authorId" TEXT NOT NULL,
    "pushToEmail" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "maxScholars" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupervisorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "researchArea" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScholarProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarSupervisorRequest" (
    "id" TEXT NOT NULL,
    "scholarId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScholarSupervisorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadAttachment" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "type" "AttachmentType" NOT NULL DEFAULT 'DOCUMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadLike" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadShare" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadReport" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedThread" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchConnection" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemAnnouncement_authorId_idx" ON "SystemAnnouncement"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_name_key" ON "Faculty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupervisorProfile_userId_key" ON "SupervisorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupervisorProfile_employeeId_key" ON "SupervisorProfile"("employeeId");

-- CreateIndex
CREATE INDEX "SupervisorProfile_facultyId_idx" ON "SupervisorProfile"("facultyId");

-- CreateIndex
CREATE INDEX "SupervisorProfile_departmentId_idx" ON "SupervisorProfile"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarProfile_userId_key" ON "ScholarProfile"("userId");

-- CreateIndex
CREATE INDEX "ScholarProfile_facultyId_idx" ON "ScholarProfile"("facultyId");

-- CreateIndex
CREATE INDEX "ScholarProfile_departmentId_idx" ON "ScholarProfile"("departmentId");

-- CreateIndex
CREATE INDEX "ScholarSupervisorRequest_scholarId_idx" ON "ScholarSupervisorRequest"("scholarId");

-- CreateIndex
CREATE INDEX "ScholarSupervisorRequest_supervisorId_idx" ON "ScholarSupervisorRequest"("supervisorId");

-- CreateIndex
CREATE INDEX "ThreadAttachment_threadId_idx" ON "ThreadAttachment"("threadId");

-- CreateIndex
CREATE INDEX "ThreadLike_threadId_idx" ON "ThreadLike"("threadId");

-- CreateIndex
CREATE INDEX "ThreadLike_userId_idx" ON "ThreadLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadLike_threadId_userId_key" ON "ThreadLike"("threadId", "userId");

-- CreateIndex
CREATE INDEX "ThreadShare_threadId_idx" ON "ThreadShare"("threadId");

-- CreateIndex
CREATE INDEX "ThreadShare_userId_idx" ON "ThreadShare"("userId");

-- CreateIndex
CREATE INDEX "ThreadReport_threadId_idx" ON "ThreadReport"("threadId");

-- CreateIndex
CREATE INDEX "ThreadReport_reporterId_idx" ON "ThreadReport"("reporterId");

-- CreateIndex
CREATE INDEX "SavedThread_threadId_idx" ON "SavedThread"("threadId");

-- CreateIndex
CREATE INDEX "SavedThread_userId_idx" ON "SavedThread"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedThread_threadId_userId_key" ON "SavedThread"("threadId", "userId");

-- CreateIndex
CREATE INDEX "ResearchConnection_requesterId_idx" ON "ResearchConnection"("requesterId");

-- CreateIndex
CREATE INDEX "ResearchConnection_receiverId_idx" ON "ResearchConnection"("receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchConnection_requesterId_receiverId_key" ON "ResearchConnection"("requesterId", "receiverId");

-- CreateIndex
CREATE INDEX "CollaborationRequest_scholarId_idx" ON "CollaborationRequest"("scholarId");

-- CreateIndex
CREATE INDEX "CollaborationRequest_opportunityId_idx" ON "CollaborationRequest"("opportunityId");

-- CreateIndex
CREATE INDEX "CollaborationRequest_threadId_idx" ON "CollaborationRequest"("threadId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Department_facultyId_idx" ON "Department"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemAnnouncement" ADD CONSTRAINT "SystemAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationRequest" ADD CONSTRAINT "CollaborationRequest_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorProfile" ADD CONSTRAINT "SupervisorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorProfile" ADD CONSTRAINT "SupervisorProfile_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorProfile" ADD CONSTRAINT "SupervisorProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarProfile" ADD CONSTRAINT "ScholarProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarProfile" ADD CONSTRAINT "ScholarProfile_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarProfile" ADD CONSTRAINT "ScholarProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarSupervisorRequest" ADD CONSTRAINT "ScholarSupervisorRequest_scholarId_fkey" FOREIGN KEY ("scholarId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarSupervisorRequest" ADD CONSTRAINT "ScholarSupervisorRequest_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadAttachment" ADD CONSTRAINT "ThreadAttachment_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadLike" ADD CONSTRAINT "ThreadLike_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadLike" ADD CONSTRAINT "ThreadLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadShare" ADD CONSTRAINT "ThreadShare_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadShare" ADD CONSTRAINT "ThreadShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadReport" ADD CONSTRAINT "ThreadReport_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadReport" ADD CONSTRAINT "ThreadReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedThread" ADD CONSTRAINT "SavedThread_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedThread" ADD CONSTRAINT "SavedThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchConnection" ADD CONSTRAINT "ResearchConnection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchConnection" ADD CONSTRAINT "ResearchConnection_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
