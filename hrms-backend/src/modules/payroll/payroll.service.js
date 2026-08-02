import prisma from "../../config/prisma.js";

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function computePay(structure) {
  const gross =
    Number(structure.basicSalary) +
    Number(structure.housingAllowance || 0) +
    Number(structure.transportAllowance || 0) +
    Number(structure.otherAllowance || 0);
  const pensionDeduction = round2((gross * Number(structure.pensionRate ?? 8)) / 100);
  const taxDeduction = round2((gross * Number(structure.taxRate ?? 0)) / 100);
  const nhfDeduction = round2((gross * Number(structure.nhfRate ?? 2.5)) / 100);
  const otherDeductions = 0;
  const netSalary = round2(gross - pensionDeduction - taxDeduction - nhfDeduction - otherDeductions);

  return {
    grossEarnings: round2(gross),
    pensionDeduction,
    taxDeduction,
    nhfDeduction,
    otherDeductions,
    netSalary,
  };
}

async function assertEmployeeInCompany(companyId, employeeId) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!employee) {
    const err = new Error("Employee not found in this company");
    err.status = 404;
    throw err;
  }
  return employee;
}

export async function createSalaryStructure(companyId, data) {
  await assertEmployeeInCompany(companyId, data.employeeId);

  return prisma.salaryStructure.create({
    data: {
      employeeId: data.employeeId,
      basicSalary: data.basicSalary,
      housingAllowance: data.housingAllowance ?? 0,
      transportAllowance: data.transportAllowance ?? 0,
      otherAllowance: data.otherAllowance ?? 0,
      pensionRate: data.pensionRate ?? 8,
      taxRate: data.taxRate ?? null,
      nhfRate: data.nhfRate ?? 2.5,
      effectiveFrom: new Date(data.effectiveFrom),
    },
  });
}

export async function updateSalaryStructure(companyId, structureId, data) {
  const existing = await prisma.salaryStructure.findFirst({
    where: { id: structureId, employee: { companyId } },
  });
  if (!existing) {
    const err = new Error("Salary structure not found");
    err.status = 404;
    throw err;
  }

  return prisma.salaryStructure.update({
    where: { id: structureId },
    data,
  });
}

export async function listSalaryStructures(companyId) {
  return prisma.salaryStructure.findMany({
    where: { employee: { companyId } },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
    },
    orderBy: [{ employeeId: "asc" }, { effectiveFrom: "desc" }],
  });
}

export async function getSalaryStructure(companyId, structureId) {
  const structure = await prisma.salaryStructure.findFirst({
    where: { id: structureId, employee: { companyId } },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
    },
  });
  if (!structure) {
    const err = new Error("Salary structure not found");
    err.status = 404;
    throw err;
  }
  return structure;
}

export async function runPayroll(companyId, { month, year }) {
  const employees = await prisma.employee.findMany({
    where: { companyId, status: "active" },
    include: {
      salaryStructures: { orderBy: { effectiveFrom: "desc" }, take: 1 },
    },
  });

  let generated = 0;
  let skipped = 0;

  for (const employee of employees) {
    const structure = employee.salaryStructures[0];
    if (!structure) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.payslip.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: employee.id,
          month,
          year,
        },
      },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.payslip.create({
      data: {
        employeeId: employee.id,
        salaryStructureId: structure.id,
        month,
        year,
        ...computePay(structure),
      },
    });
    generated += 1;
  }

  return { month, year, generated, skipped, total: employees.length };
}

export async function listPayslips(companyId, filters = {}) {
  const { month, year, departmentId, status } = filters;

  return prisma.payslip.findMany({
    where: {
      employee: {
        companyId,
        ...(departmentId && { departmentId: Number(departmentId) }),
      },
      ...(month && { month: Number(month) }),
      ...(year && { year: Number(year) }),
      ...(status && { status }),
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function getPayslip(companyId, user, payslipId) {
  const payslip = await prisma.payslip.findFirst({
    where: { id: payslipId, employee: { companyId } },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
    },
  });

  if (!payslip) {
    const err = new Error("Payslip not found");
    err.status = 404;
    throw err;
  }

  const isSelf = payslip.employeeId === user.employeeId;
  if (user.roleName === "employee" && !isSelf) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return payslip;
}

export async function myPayslips(companyId, employeeId) {
  await assertEmployeeInCompany(companyId, employeeId);

  return prisma.payslip.findMany({
    where: { employeeId },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function markPayslipPaid(companyId, payslipId) {
  const payslip = await prisma.payslip.findFirst({
    where: { id: payslipId, employee: { companyId } },
  });
  if (!payslip) {
    const err = new Error("Payslip not found");
    err.status = 404;
    throw err;
  }
  if (payslip.status === "paid") {
    const err = new Error("Payslip is already marked as paid");
    err.status = 409;
    throw err;
  }

  return prisma.payslip.update({
    where: { id: payslipId },
    data: { status: "paid", paidOn: new Date() },
  });
}
