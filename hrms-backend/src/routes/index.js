import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import companyRoutes from "../modules/companies/company.routes.js";
import departmentRoutes from "../modules/departments/department.routes.js";
import employeeRoutes from "../modules/employees/employee.routes.js";
// ---- Recruitment module imports ----
import jobRoutes, { publicJobRoutes } from "../modules/jobs/job.routes.js";
import applicantRoutes, {
  publicApplicantRoutes,
} from "../modules/applicants/applicant.routes.js";
import interviewRoutes, {
  applicantInterviewRoutes,
} from "../modules/interviews/interview.routes.js";
import leaveRoutes from "../modules/leave/leave.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import auditLogRoutes from "../modules/auditLog/auditLog.routes.js";
import goalRoutes from "../modules/goals/goal.routes.js";
import reviewRoutes from "../modules/reviews/review.routes.js";
import reportRoutes from "../modules/reports/report.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import payrollRoutes from "../modules/payroll/payroll.routes.js";
import * as reportController from "../modules/reports/report.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import tenantMiddleware from "../middlewares/tenant.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

import auditLogger from "../middlewares/auditLogger.middleware.js";

const router = express.Router();

// Auth-Companies-Employees — Foundation (Abayomi)
router.use("/auth", authRoutes);
router.use("/companies", auditLogger("companies"), companyRoutes);
router.use("/departments", auditLogger("departments"), departmentRoutes);
router.use("/employees", auditLogger("employees"), employeeRoutes);

// ---- Recruitment module routes ---- Animasaun Farouk
router.use("/jobs", auditLogger("jobs"), jobRoutes);
router.use("/applicants", auditLogger("applicants"), applicantRoutes);
router.use("/applicants", applicantInterviewRoutes);
router.use("/interviews", auditLogger("interviews"), interviewRoutes);
router.use("/public/jobs", publicJobRoutes);
router.use("/public", publicApplicantRoutes);

//  Leave, Notifications, Audit
router.use("/leave", auditLogger("leave"), leaveRoutes);
router.use("/notifications", notificationRoutes);
router.use("/audit-logs", auditLogRoutes);

//  Goals, Reviews, Reports & Dashboard
router.use("/goals", auditLogger("goals"), goalRoutes);
router.use("/reviews", auditLogger("reviews"), reviewRoutes);
router.use("/reports", reportRoutes);

//  Attendance & Payroll
router.use("/attendance", auditLogger("attendance"), attendanceRoutes);
router.use("/payroll", auditLogger("payroll"), payrollRoutes);

router.get(
  "/dashboard/admin",
  authMiddleware,
  tenantMiddleware,
  requireRole(["hr_admin"]),
  reportController.adminDashboard
);

export default router;
