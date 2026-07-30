import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateCreateJob, validateJobStatusUpdate } from "./job.validator.js";
import {
  createJob,
  getAllJobs,
  getPublicJobs,
  getJobById,
  updateJob,
  deleteJob,
} from "./job.controller.js";
import { getApplicantsByJob } from "../applicants/applicant.controller.js";

const router = Router();
const publicRouter = Router();

// Protected — hr_admin, manager
router.get("/", authMiddleware, requireRole(["hr_admin", "manager"]), getAllJobs);
router.post("/", authMiddleware, requireRole(["hr_admin"]), validateCreateJob, createJob);
router.get("/:id", authMiddleware, requireRole(["hr_admin", "manager"]), getJobById);
router.patch("/:id", authMiddleware, requireRole(["hr_admin"]), validateJobStatusUpdate, updateJob);
router.delete("/:id", authMiddleware, requireRole(["hr_admin"]), deleteJob);
router.get("/:jobId/applicants", authMiddleware, requireRole(["hr_admin", "manager"]), getApplicantsByJob);

// Public — no token required
publicRouter.get("/", getPublicJobs);
publicRouter.get("/:id", getJobById);

export { publicRouter as publicJobRoutes };
export default router;