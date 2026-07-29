import prisma from "../../config/prisma.js";

export async function listDepartments(companyId) {
  return prisma.department.findMany({
    where: { companyId },
    include: {
      head: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { employees: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createDepartment(companyId, data) {
  return prisma.department.create({
    data: { ...data, companyId },
  });
}

export async function updateDepartment(companyId, departmentId, data) {
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

export async function deleteDepartment(companyId, departmentId) {
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
