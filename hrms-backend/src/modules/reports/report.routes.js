import express from "express";
import * as reportController from "./report.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  "/employee-summary",
  requireRole(["hr_admin"]),
  reportController.employeeSummary
);

router.get(
  "/department",
  requireRole(["hr_admin"]),
  reportController.departmentSummary
);

router.get(
  "/leave",
  requireRole(["hr_admin", "manager"]),
  reportController.leaveReport
);

router.get(
  "/attendance",
  requireRole(["hr_admin", "manager"]),
  reportController.attendanceReport
);

router.get(
  "/recruitment",
  requireRole(["hr_admin"]),
  reportController.recruitmentReport
);

router.get(
  "/payroll-summary",
  requireRole(["hr_admin"]),
  reportController.payrollSummary
);

export default router;
