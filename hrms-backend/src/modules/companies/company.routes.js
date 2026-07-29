import express from "express";
import * as companyController from "./company.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  validate,
  createCompanySchema,
  updateCompanySchema,
} from "./company.validator.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole(["super_admin"]),
  validate(createCompanySchema),
  companyController.create
);

router.get(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  requireRole(["hr_admin", "super_admin"]),
  companyController.getById
);

router.patch(
  "/:id",
  authMiddleware,
  tenantMiddleware,
  requireRole(["hr_admin", "super_admin"]),
  validate(updateCompanySchema),
  companyController.update
);

export default router;
