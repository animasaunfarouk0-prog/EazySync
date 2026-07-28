const express = require("express");
const router = express.Router();

const departmentController = require("./department.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const tenantMiddleware = require("../../middlewares/tenant.middleware");
const { requireRole } = require("../../middlewares/rbac.middleware");
const {
  validate,
  createDepartmentSchema,
  updateDepartmentSchema,
} = require("./department.validator");

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

module.exports = router;
