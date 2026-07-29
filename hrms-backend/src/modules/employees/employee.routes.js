const express = require("express");
const router = express.Router();

const employeeController = require("./employee.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const tenantMiddleware = require("../../middlewares/tenant.middleware");
const {
  requireRole,
  requireSelfOrRole,
} = require("../../middlewares/rbac.middleware");
const upload = require("../../config/multer");
const {
  validate,
  validateUpdate,
  createEmployeeSchema,
} = require("./employee.validator");

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

module.exports = router;
