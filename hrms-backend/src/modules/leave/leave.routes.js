import express from "express";
import * as leaveController from "./leave.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  validate,
  createLeaveRequestSchema,
  approveRejectSchema,
  cancelSchema,
  createLeaveTypeSchema,
  createBalanceSchema,
} from "./leave.validator.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/types", requireRole(["hr_admin", "manager"]), leaveController.listTypes);
router.post(
  "/types",
  requireRole(["hr_admin"]),
  validate(createLeaveTypeSchema),
  leaveController.createType
);
router.post(
  "/types/:id/balances",
  requireRole(["hr_admin"]),
  validate(createBalanceSchema),
  leaveController.createBalance
);

router.get(
  "/dashboard",
  requireRole(["hr_admin", "manager"]),
  leaveController.dashboard
);

router.get(
  "/requests",
  requireRole(["hr_admin", "manager", "employee"]),
  leaveController.list
);

router.post(
  "/requests",
  requireRole(["employee"]),
  validate(createLeaveRequestSchema),
  leaveController.create
);

router.get(
  "/requests/:id",
  requireRole(["hr_admin", "manager", "employee"]),
  leaveController.getById
);

router.patch(
  "/requests/:id/approve",
  requireRole(["manager", "hr_admin"]),
  validate(approveRejectSchema),
  leaveController.approve
);

router.patch(
  "/requests/:id/reject",
  requireRole(["manager", "hr_admin"]),
  validate(approveRejectSchema),
  leaveController.reject
);

router.patch(
  "/requests/:id/cancel",
  requireRole(["employee"]),
  validate(cancelSchema),
  leaveController.cancel
);

router.get(
  "/balance",
  requireRole(["employee"]),
  leaveController.myBalance
);

router.get(
  "/balance/:employeeId",
  requireRole(["hr_admin", "manager"]),
  leaveController.employeeBalance
);

router.get(
  "/calendar",
  requireRole(["hr_admin", "manager", "employee"]),
  leaveController.calendar
);

export default router;
