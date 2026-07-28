const prisma = require("../../config/prisma");

async function listDepartments(companyId) {
  return prisma.department.findMany({
    where: { companyId },
    include: {
      head: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { employees: true } },
    },
    orderBy: { name: "asc" },
  });
}

async function createDepartment(companyId, data) {
  return prisma.department.create({
    data: { ...data, companyId },
  });
}

async function updateDepartment(companyId, departmentId, data) {
  const existing = await prisma.department.findFirst({
    where: { id: departmentId, companyId },
  });

  if (!existing) {
    const err = new Error("Department not found");
    err.status = 404;
    throw err;
  }

  return prisma.department.update({
    where: { id: departmentId },
    data,
  });
}

async function deleteDepartment(companyId, departmentId) {
  const existing = await prisma.department.findFirst({
    where: { id: departmentId, companyId },
  });

  if (!existing) {
    const err = new Error("Department not found");
    err.status = 404;
    throw err;
  }

  await prisma.department.delete({ where: { id: departmentId } });
}

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
