import express from "express";
import * as authController from "./auth.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import verifyGoogleToken from "./googleTokenVerifier.middleware.js";
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  googleAuthSchema,
} from "./auth.validator.js";

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post(
  "/google",
  validate(googleAuthSchema),
  verifyGoogleToken,
  authController.googleAuth
);

router.post("/logout", authMiddleware, authController.logout);

export default router;
