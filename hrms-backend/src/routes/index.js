import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import companyRoutes from "../modules/companies/company.routes.js";
import departmentRoutes from "../modules/departments/department.routes.js";
import employeeRoutes from "../modules/employees/employee.routes.js";
import leaveRoutes from "../modules/leave/leave.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import auditLogRoutes from "../modules/auditLog/auditLog.routes.js";
import goalRoutes from "../modules/goals/goal.routes.js";
import reviewRoutes from "../modules/reviews/review.routes.js";
import reportRoutes from "../modules/reports/report.routes.js";
import * as reportController from "../modules/reports/report.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import tenantMiddleware from "../middlewares/tenant.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const router = express.Router();

// Person 1 — Foundation (Abayomi)
router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/departments", departmentRoutes);
router.use("/employees", employeeRoutes);

// Person 3 — Leave, Notifications, Audit
router.use("/leave", leaveRoutes);
router.use("/notifications", notificationRoutes);
router.use("/audit-logs", auditLogRoutes);

// Person 4 — Goals, Reviews, Reports & Dashboard
router.use("/goals", goalRoutes);
router.use("/reviews", reviewRoutes);
router.use("/reports", reportRoutes);

router.get(
  "/dashboard/admin",
  authMiddleware,
  tenantMiddleware,
  requireRole(["hr_admin"]),
  reportController.adminDashboard
);

export default router;
