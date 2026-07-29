import prisma from "../../config/prisma.js";

async function generateEmployeeCode(companyId) {
  const lastEmployee = await prisma.employee.findFirst({
    where: { companyId, employeeCode: { not: null } },
    orderBy: { employeeCode: "desc" },
  });

  let nextNumber = 1;
  if (lastEmployee?.employeeCode) {
    const match = lastEmployee.employeeCode.match(/(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  return `EMP${String(nextNumber).padStart(3, "0")}`;
}

export async function listEmployees(
  companyId,
  { departmentId, status, search } = {}
) {
  return prisma.employee.findMany({
    where: {
      companyId,
      ...(departmentId && { departmentId: Number(departmentId) }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { position: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      department: { select: { id: true, name: true } },
      user: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEmployee(companyId, data) {
  const user = await prisma.user.findFirst({
    where: { id: data.userId, companyId },
    include: { employee: true },
  });

  if (!user) {
    const err = new Error("User not found in this company");
    err.status = 404;
    throw err;
  }
  if (user.employee) {
    const err = new Error("This user already has an employee record");
    err.status = 409;
    throw err;
  }

  const employeeCode = await generateEmployeeCode(companyId);

  return prisma.employee.create({
    data: {
      ...data,
      companyId,
      employeeCode,
    },
  });
}

export async function getEmployeeById(companyId, employeeId) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
    include: {
      department: { select: { id: true, name: true } },
      user: { select: { email: true } },
      reportsTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!employee) {
    const err = new Error("Employee not found");
    err.status = 404;
    throw err;
  }

  return employee;
}

export async function updateEmployee(companyId, employeeId, data) {
  const existing = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!existing) {
    const err = new Error("Employee not found");
    err.status = 404;
    throw err;
  }

  return prisma.employee.update({
    where: { id: employeeId },
    data,
  });
}

export async function deleteEmployee(companyId, employeeId) {
  const existing = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!existing) {
    const err = new Error("Employee not found");
    err.status = 404;
    throw err;
  }

  await prisma.employee.delete({ where: { id: employeeId } });
}

export async function addDocument(
  companyId,
  employeeId,
  { documentType, fileUrl }
) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!employee) {
    const err = new Error("Employee not found");
    err.status = 404;
    throw err;
  }

  return prisma.employeeDocument.create({
    data: { employeeId, documentType, fileUrl },
  });
}

export async function listDocuments(companyId, employeeId) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!employee) {
    const err = new Error("Employee not found");
    err.status = 404;
    throw err;
  }

  return prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { uploadedAt: "desc" },
  });
}
