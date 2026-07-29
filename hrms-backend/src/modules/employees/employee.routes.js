// src/modules/employees/employee.routes.js

import express from "express";
import * as employeeController from "./employee.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import {
  requireRole,
  requireSelfOrRole,
} from "../../middlewares/rbac.middleware.js";
import upload from "../../config/multer.js";
import {
  validate,
  validateUpdate,
  createEmployeeSchema,
} from "./employee.validator.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get("/", requireRole(["hr_admin", "manager"]), employeeController.list);
router.post(
  "/",
  requireRole(["hr_admin"]),
  validate(createEmployeeSchema),
  employeeController.create
);

router.get(
  "/:id",
  requireSelfOrRole(["hr_admin", "manager"], "id"),
  employeeController.getById
);

router.patch(
  "/:id",
  requireSelfOrRole(["hr_admin"], "id"),
  validateUpdate,
  employeeController.update
);

router.delete("/:id", requireRole(["hr_admin"]), employeeController.remove);

router.post(
  "/:id/documents",
  requireSelfOrRole(["hr_admin"], "id"),
  upload.single("document"),
  employeeController.uploadDocument
);

router.get(
  "/:id/documents",
  requireSelfOrRole(["hr_admin"], "id"),
  employeeController.listDocuments
);

export default router;
