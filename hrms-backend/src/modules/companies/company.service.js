const prisma = require("../../config/prisma");
const { signAccessToken, signRefreshToken } = require("../../utils/jwt");

async function createCompany(userId, data) {
  const company = await prisma.company.create({ data });

  await prisma.user.update({
    where: { id: userId },
    data: { companyId: company.id },
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, employee: true },
  });

  const accessToken = signAccessToken(updatedUser);
  const refreshToken = signRefreshToken(updatedUser);

  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken },
  });

  return { company, accessToken, refreshToken };
}

async function getCompanyById(companyId, requestingCompanyId) {
  if (companyId !== requestingCompanyId) {
    const err = new Error("You do not have access to this company");
    err.status = 403;
    throw err;
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!company) {
    const err = new Error("Company not found");
    err.status = 404;
    throw err;
  }

  return company;
}

async function updateCompany(companyId, requestingCompanyId, data) {
  if (companyId !== requestingCompanyId) {
    const err = new Error("You do not have access to this company");
    err.status = 403;
    throw err;
  }

  return prisma.company.update({
    where: { id: companyId },
    data,
  });
}

module.exports = { createCompany, getCompanyById, updateCompany };
