const authService = require("./auth.service");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.userId);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPassword(req.body.email);

    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body);
    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
}

async function googleAuth(req, res, next) {
  try {
    const result = await authService.googleAuth(req.googleProfile);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  googleAuth,
};
