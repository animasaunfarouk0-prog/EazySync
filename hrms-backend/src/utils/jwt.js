import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

function buildPayload(user) {
  return {
    userId: user.id,
    roleId: user.roleId,
    roleName: user.role?.name,
    companyId: user.companyId,
    employeeId: user.employee?.id ?? null,
  };
}

export function signAccessToken(user) {
  return jwt.sign(buildPayload(user), ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ userId: user.id }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
