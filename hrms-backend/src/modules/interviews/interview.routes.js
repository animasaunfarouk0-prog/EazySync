import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import { validateCreateInterview, validateUpdateInterview } from "./interview.validator.js";
import { createInterview, getInterviewsByApplicant, updateInterview } from "./interview.controller.js";

const applicantInterviewRoutes = Router();
const interviewRoutes = Router();

// Mounted under /applicants
applicantInterviewRoutes.get(
  "/:id/interviews",
  authMiddleware,
  requireRole(["hr_admin", "manager"]),
  getInterviewsByApplicant
);
applicantInterviewRoutes.post(
  "/:id/interviews",
  authMiddleware,
  requireRole(["hr_admin"]),
  validateCreateInterview,
  createInterview
);

// Mounted under /interviews
interviewRoutes.patch("/:id", authMiddleware, requireRole(["hr_admin"]), validateUpdateInterview, updateInterview);

export { applicantInterviewRoutes };
export default interviewRoutes;