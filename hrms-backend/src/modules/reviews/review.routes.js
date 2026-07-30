import express from "express";
import * as reviewController from "./review.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import { requireRole } from "../../middlewares/rbac.middleware.js";
import {
  validate,
  createReviewSchema,
  updateReviewSchema,
  feedbackSchema,
} from "./review.validator.js";

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.get(
  "/",
  requireRole(["hr_admin", "manager", "employee"]),
  reviewController.list
);

router.post(
  "/",
  requireRole(["hr_admin", "manager"]),
  validate(createReviewSchema),
  reviewController.create
);

router.get(
  "/:id",
  requireRole(["hr_admin", "manager", "employee"]),
  reviewController.getById
);

router.patch(
  "/:id",
  requireRole(["manager"]),
  validate(updateReviewSchema),
  reviewController.update
);

router.post(
  "/:id/feedback",
  requireRole(["manager"]),
  validate(feedbackSchema),
  reviewController.submitFeedback
);

router.patch(
  "/:id/feedback/draft",
  requireRole(["manager"]),
  validate(feedbackSchema),
  reviewController.saveFeedbackDraft
);

export default router;
