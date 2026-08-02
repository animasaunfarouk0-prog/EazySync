import express from "express";
import * as payrollController from "./payroll.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  validate,
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  runPayrollSchema,
} from "./payroll.validator.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  "/salary-structures",
  requireRole(["hr_admin"]),
  payrollController.listSalaryStructures
);
router.post(
  "/salary-structures",
  requireRole(["hr_admin"]),
  validate(createSalaryStructureSchema),
  payrollController.createSalaryStructure
);
router.get(
  "/salary-structures/:id",
  requireRole(["hr_admin"]),
  payrollController.getSalaryStructure
);
router.patch(
  "/salary-structures/:id",
  requireRole(["hr_admin"]),
  validate(updateSalaryStructureSchema),
  payrollController.updateSalaryStructure
);

router.post(
  "/run",
  requireRole(["hr_admin"]),
  validate(runPayrollSchema),
  payrollController.runPayroll
);

router.get("/payslips/me", requireRole(["employee"]), payrollController.myPayslips);
router.get(
  "/payslips",
  requireRole(["hr_admin", "manager"]),
  payrollController.listPayslips
);
router.get(
  "/payslips/:id",
  requireRole(["hr_admin", "manager", "employee"]),
  payrollController.getPayslip
);
router.patch(
  "/payslips/:id/mark-paid",
  requireRole(["hr_admin"]),
  payrollController.markPayslipPaid
);

export default router;
