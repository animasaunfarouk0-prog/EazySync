const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = require("../../config/prisma");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../utils/jwt");

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
async function getUserWithRelations(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, employee: true },
  });
}

async function register({
  email,
  password,
  firstName,
  lastName,
  companyId,
  roleName,
}) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("An account with this email already exists");
    err.status = 409;
    throw err;
  }

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    const err = new Error(`Invalid role: ${roleName}`);
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      companyId: companyId ?? null,
      roleId: role.id,
    },
  });

  const fullUser = await getUserWithRelations(user.id);
  const accessToken = signAccessToken(fullUser);
  const refreshToken = signRefreshToken(fullUser);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { user: sanitizeUser(fullUser), accessToken, refreshToken };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, employee: true },
  });

  if (!user || !user.passwordHash) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

async function logout(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

async function refresh(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    const e = new Error("Invalid or expired refresh token");
    e.status = 401;
    throw e;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { role: true, employee: true },
  });

  // Reject if the token doesn't match what's stored — covers the case
  // where a refresh token was already used/rotated or the user logged out.
  if (!user || user.refreshToken !== refreshToken) {
    const err = new Error("Refresh token no longer valid");
    err.status = 401;
    throw err;
  }

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond as if it succeeded, even if the email isn't found —
  // prevents leaking which emails are registered.
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpires },
  });

  // TODO: send resetToken via email (Nodemailer) once notification
  // service exists. For now, log it so it's usable in dev/testing.
  console.log(`[DEV ONLY] Password reset token for ${email}: ${resetToken}`);

  return resetToken;
}

async function resetPassword({ token, newPassword }) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
    const err = new Error("Reset token is invalid or has expired");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
      refreshToken: null, // force re-login on all devices after password change
    },
  });
}

// Google OAuth — expects an ID token already verified client-side or via
// google-auth-library. googleProfile = { googleId, email, firstName, lastName }
async function googleAuth(googleProfile) {
  const { googleId, email } = googleProfile;

  let user = await prisma.user.findUnique({
    where: { googleId },
    include: { role: true, employee: true },
  });

  if (!user) {
    // If an account with this email already exists (registered via
    // password), link the Google ID to it instead of creating a duplicate.
    user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, isVerified: true },
        include: { role: true, employee: true },
      });
    } else {
      const applicantRole = await prisma.role.findUnique({
        where: { name: "applicant" },
      });
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          isVerified: true,
          roleId: applicantRole.id, // default role for a brand-new Google sign-in
        },
        include: { role: true, employee: true },
      });
    }
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

// Never return passwordHash/refreshToken/resetToken to the client
function sanitizeUser(user) {
  const { passwordHash, refreshToken, resetToken, resetTokenExpires, ...safe } =
    user;
  return safe;
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
