import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { uploadResume } from "../../middlewares/resumeUpload.middleware.js";
import { validateApply, validateApplicantStatusUpdate } from "./applicant.validator.js";
import {
  applyToJob,
  getApplicantById,
  updateApplicantStatus,
  getMyApplications,
  getMyApplicationById,
} from "./applicant.controller.js";

const router = Router();
const publicRouter = Router();

router.use(authMiddleware, tenantMiddleware);

// Protected — hr_admin, manager
router.get("/:id", authMiddleware, requireRole(["hr_admin", "manager"]), getApplicantById);
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole(["hr_admin", "manager"]),
  validateApplicantStatusUpdate,
  updateApplicantStatus
);

// Public — anyone can apply, no token required
publicRouter.post("/jobs/:jobId/apply", uploadResume, validateApply, applyToJob);

// Applicant-only — must be logged in as an applicant
publicRouter.get("/applicants/me", authMiddleware, requireRole(["applicant"]), getMyApplications);
publicRouter.get("/applicants/me/:id", authMiddleware, requireRole(["applicant"]), getMyApplicationById);

export { publicRouter as publicApplicantRoutes };
export default router;