const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const verifyGoogleToken = require("./googleTokenVerifier.middleware");
const {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  googleAuthSchema,
} = require("./auth.validator");

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

module.exports = router;
