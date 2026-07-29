import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../../config/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

async function getUserWithRelations(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, employee: true },
  });
}

export async function register({
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

export async function login({ email, password }) {
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

export async function logout(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export async function refresh(refreshToken) {
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

export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpires },
  });

  console.log(`[DEV ONLY] Password reset token for ${email}: ${resetToken}`);

  return resetToken;
}

export async function resetPassword({ token, newPassword }) {
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
      refreshToken: null,
    },
  });
}

export async function googleAuth(googleProfile) {
  const { googleId, email } = googleProfile;

  let user = await prisma.user.findUnique({
    where: { googleId },
    include: { role: true, employee: true },
  });

  if (!user) {
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
          roleId: applicantRole.id,
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

function sanitizeUser(user) {
  const { passwordHash, refreshToken, resetToken, resetTokenExpires, ...safe } =
    user;
  return safe;
}
