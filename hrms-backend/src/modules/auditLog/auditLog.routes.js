import express from "express";
import * as auditLogController from "./auditLog.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  "/",
  requireRole(["hr_admin", "super_admin"]),
  auditLogController.list
);

export default router;
