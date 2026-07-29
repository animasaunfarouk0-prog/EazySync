import express from "express";
import * as departmentController from "./department.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  validate,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "./department.validator.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  "/",
  requireRole(["hr_admin", "manager"]),
  departmentController.list
);
router.post(
  "/",
  requireRole(["hr_admin"]),
  validate(createDepartmentSchema),
  departmentController.create
);
router.patch(
  "/:id",
  requireRole(["hr_admin"]),
  validate(updateDepartmentSchema),
  departmentController.update
);
router.delete("/:id", requireRole(["hr_admin"]), departmentController.remove);

export default router;
