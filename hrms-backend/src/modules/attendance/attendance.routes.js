import express from "express";
import * as attendanceController from "./attendance.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  validate,
  createAttendanceRecordSchema,
  updateAttendanceRecordSchema,
} from "./attendance.validator.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post("/clock-in", requireRole(["employee"]), attendanceController.clockIn);
router.post("/clock-out", requireRole(["employee"]), attendanceController.clockOut);
router.get("/me", requireRole(["employee"]), attendanceController.myRecords);

router.get(
  "/",
  requireRole(["hr_admin", "manager"]),
  attendanceController.list
);
router.post(
  "/",
  requireRole(["hr_admin", "manager"]),
  validate(createAttendanceRecordSchema),
  attendanceController.create
);
router.get(
  "/:id",
  requireRole(["hr_admin", "manager", "employee"]),
  attendanceController.getById
);
router.patch(
  "/:id",
  requireRole(["hr_admin", "manager"]),
  validate(updateAttendanceRecordSchema),
  attendanceController.update
);

export default router;
