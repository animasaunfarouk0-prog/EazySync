const express = require("express");
const router = express.Router();

const companyController = require("./company.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const tenantMiddleware = require("../../middlewares/tenant.middleware");
const { requireRole } = require("../../middlewares/rbac.middleware");
const {
  validate,
  createCompanySchema,
  updateCompanySchema,
} = require("./company.validator");

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

module.exports = router;
