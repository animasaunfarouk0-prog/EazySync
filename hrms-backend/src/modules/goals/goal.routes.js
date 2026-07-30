import express from "express";
import * as goalController from "./goal.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  validate,
  createGoalSchema,
  updateGoalSchema,
} from "./goal.validator.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  "/",
  requireRole(["hr_admin", "manager", "employee"]),
  goalController.list
);

router.post(
  "/",
  requireRole(["manager", "hr_admin"]),
  validate(createGoalSchema),
  goalController.create
);

router.get(
  "/:id",
  requireRole(["hr_admin", "manager", "employee"]),
  goalController.getById
);

router.patch(
  "/:id",
  requireRole(["manager", "hr_admin", "employee"]),
  validate(updateGoalSchema),
  goalController.update
);

export default router;
