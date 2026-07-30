-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('generated', 'paid');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'weekly_off', 'on_leave');

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "basic_salary" DECIMAL(12,2) NOT NULL,
    "housing_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transport_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "other_allowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pension_rate" DECIMAL(5,2) NOT NULL DEFAULT 8.0,
    "tax_rate" DECIMAL(5,2),
    "nhf_rate" DECIMAL(5,2) NOT NULL DEFAULT 2.5,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "salary_structure_id" INTEGER,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "gross_earnings" DECIMAL(12,2),
    "pension_deduction" DECIMAL(12,2),
    "tax_deduction" DECIMAL(12,2),
    "nhf_deduction" DECIMAL(12,2),
    "other_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(12,2),
    "status" "PayslipStatus" NOT NULL DEFAULT 'generated',
    "paid_on" TIMESTAMP(3),
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "clock_in" TIME,
    "clock_out" TIME,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_structures_employee_id_idx" ON "salary_structures"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_employee_id_month_year_key" ON "payslips"("employee_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_employee_id_date_key" ON "attendance_records"("employee_id", "date");

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_salary_structure_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
