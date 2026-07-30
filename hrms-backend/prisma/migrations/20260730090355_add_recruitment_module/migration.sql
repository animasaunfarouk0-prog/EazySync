-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('draft', 'open', 'on_hold', 'closed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('new', 'in_review', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected');

-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('onsite', 'remote', 'phone');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "department_id" INTEGER,
    "posted_by" INTEGER,
    "job_code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "location" TEXT,
    "employment_type" "EmploymentType",
    "status" "JobStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "resume_url" TEXT,
    "cover_letter" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'new',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" SERIAL NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "interviewer_id" INTEGER,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "mode" "InterviewMode" NOT NULL DEFAULT 'onsite',
    "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "feedback" TEXT,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "jobs_company_id_idx" ON "jobs"("company_id");

-- CreateIndex
CREATE INDEX "jobs_department_id_idx" ON "jobs"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_company_id_job_code_key" ON "jobs"("company_id", "job_code");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_user_id_key" ON "applicants"("user_id");

-- CreateIndex
CREATE INDEX "applicants_job_id_idx" ON "applicants"("job_id");

-- CreateIndex
CREATE INDEX "interviews_applicant_id_idx" ON "interviews"("applicant_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
