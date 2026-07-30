import prisma from "../../config/prisma.js";

export async function listGoals(companyId, user, filters = {}) {
  const { status, year, category, departmentId } = filters;
  const isSelfAccess = user.roleName === "employee";

  const where = {
    employee: { companyId },
    ...(isSelfAccess && { employeeId: user.employeeId }),
    ...(status && { status }),
    ...(year && { year: Number(year) }),
    ...(category && { category }),
    ...(departmentId && { departmentId: Number(departmentId) }),
  };

  return prisma.goal.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
      goalOwner: {
        select: { id: true, firstName: true, lastName: true },
      },
      department: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });
}

export async function getGoalById(companyId, user, goalId) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, employee: { companyId } },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
      goalOwner: {
        select: { id: true, firstName: true, lastName: true },
      },
      department: {
        select: { id: true, name: true },
      },
      reviewRatings: true,
    },
  });

  if (!goal) {
    const err = new Error("Goal not found");
    err.status = 404;
    throw err;
  }

  const isSelf = goal.employeeId === user.employeeId;
  if (user.roleName === "employee" && !isSelf) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return goal;
}

export async function createGoal(companyId, data) {
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, companyId },
  });
  if (!employee) {
    const err = new Error("Employee not found in this company");
    err.status = 404;
    throw err;
  }

  if (data.goalOwnerId) {
    const owner = await prisma.employee.findFirst({
      where: { id: data.goalOwnerId, companyId },
    });
    if (!owner) {
      const err = new Error("Goal owner not found in this company");
      err.status = 404;
      throw err;
    }
  }

  if (data.departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: data.departmentId, companyId },
    });
    if (!dept) {
      const err = new Error("Department not found in this company");
      err.status = 404;
      throw err;
    }
  }

  return prisma.goal.create({
    data: {
      employeeId: data.employeeId,
      goalOwnerId: data.goalOwnerId || null,
      departmentId: data.departmentId || null,
      title: data.title,
      category: data.category || null,
      description: data.description || null,
      weight: data.weight || null,
      dueDate: data.dueDate || null,
      status: data.status || "on_track",
      progress: data.progress ?? 0,
      year: data.year,
    },
  });
}

export async function updateGoal(companyId, user, goalId, data) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, employee: { companyId } },
  });

  if (!goal) {
    const err = new Error("Goal not found");
    err.status = 404;
    throw err;
  }

  const isSelf = goal.employeeId === user.employeeId;
  const isManagerOrAdmin = ["hr_admin", "manager"].includes(user.roleName);

  if (user.roleName === "employee" && !isSelf) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  if (!isManagerOrAdmin && !isSelf) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return prisma.goal.update({
    where: { id: goalId },
    data,
  });
}
