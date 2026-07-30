import prisma from "../../config/prisma.js";

export async function getDashboard(companyId) {
  const today = new Date();
  const year = today.getFullYear();

  const [
    pendingCount,
    approvedThisMonth,
    totalEmployees,
    onLeaveToday,
    recentRequests,
  ] = await Promise.all([
    prisma.leaveRequest.count({
      where: {
        employee: { companyId },
        status: "pending",
      },
    }),
    prisma.leaveRequest.count({
      where: {
        employee: { companyId },
        status: "approved",
        startDate: {
          gte: new Date(year, today.getMonth(), 1),
        },
      },
    }),
    prisma.employee.count({ where: { companyId, status: "active" } }),
    prisma.leaveRequest.count({
      where: {
        employee: { companyId },
        status: "approved",
        startDate: { lte: today },
        endDate: { gte: today },
      },
    }),
    prisma.leaveRequest.findMany({
      where: { employee: { companyId } },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        leaveType: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    pendingCount,
    approvedThisMonth,
    totalEmployees,
    onLeaveToday,
    recentRequests,
  };
}

export async function listRequests(companyId, user, filters = {}) {
  const { status, leaveTypeId, from, to } = filters;
  const isSelfAccess = user.roleName === "employee";

  const where = {
    employee: { companyId },
    ...(isSelfAccess && { employeeId: user.employeeId }),
    ...(status && { status }),
    ...(leaveTypeId && { leaveTypeId: Number(leaveTypeId) }),
    ...(from && { startDate: { gte: new Date(from) } }),
    ...(to && { endDate: { lte: new Date(to) } }),
  };

  return prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
      leaveType: { select: { id: true, name: true } },
      approver: {
        select: { id: true, firstName: true, lastName: true },
      },
      approvalHistory: {
        include: {
          actor: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getRequestById(companyId, user, requestId) {
  const request = await prisma.leaveRequest.findFirst({
    where: { id: requestId, employee: { companyId } },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
      leaveType: { select: { id: true, name: true } },
      approver: {
        select: { id: true, firstName: true, lastName: true },
      },
      approvalHistory: {
        include: {
          actor: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) {
    const err = new Error("Leave request not found");
    err.status = 404;
    throw err;
  }

  const isSelf = request.employeeId === user.employeeId;
  if (user.roleName === "employee" && !isSelf) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return request;
}

export async function createRequest(companyId, employeeId, data) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!employee) {
    const err = new Error("Employee not found");
    err.status = 404;
    throw err;
  }

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: data.leaveTypeId, companyId },
  });
  if (!leaveType) {
    const err = new Error("Leave type not found");
    err.status = 404;
    throw err;
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const balance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId: data.leaveTypeId,
        year: start.getFullYear(),
      },
    },
  });

  if (balance) {
    const available = Number(balance.totalDays) - Number(balance.usedDays) - Number(balance.pendingDays);
    if (diffDays > available) {
      const err = new Error(
        `Insufficient leave balance. Available: ${available} days, requested: ${diffDays} days`
      );
      err.status = 400;
      throw err;
    }
  }

  const [request] = await prisma.$transaction(async (tx) => {
    const leaveRequest = await tx.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays: diffDays,
        reason: data.reason || null,
        attachmentUrl: data.attachmentUrl || null,
      },
    });

    await tx.leaveApprovalHistory.create({
      data: {
        leaveRequestId: leaveRequest.id,
        actorId: employeeId,
        action: "submitted",
        comment: null,
      },
    });

    if (balance) {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { increment: diffDays } },
      });
    }

    return [leaveRequest];
  });

  return request;
}

export async function approveRequest(companyId, user, requestId, { comment }) {
  const request = await prisma.leaveRequest.findFirst({
    where: { id: requestId, employee: { companyId } },
    include: { leaveType: true },
  });

  if (!request) {
    const err = new Error("Leave request not found");
    err.status = 404;
    throw err;
  }

  if (request.status !== "pending") {
    const err = new Error("Leave request is not pending");
    err.status = 400;
    throw err;
  }

  const [updated] = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "approved",
        approverId: user.employeeId,
        approvalComment: comment || null,
        decidedAt: new Date(),
      },
    });

    await tx.leaveApprovalHistory.create({
      data: {
        leaveRequestId: requestId,
        actorId: user.employeeId,
        action: "approved",
        comment: comment || null,
      },
    });

    const balance = await tx.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: request.startDate.getFullYear(),
        },
      },
    });

    if (balance) {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: { decrement: Number(request.totalDays) },
          usedDays: { increment: Number(request.totalDays) },
        },
      });
    }

    return [updatedRequest];
  });

  return updated;
}

export async function rejectRequest(companyId, user, requestId, { comment }) {
  const request = await prisma.leaveRequest.findFirst({
    where: { id: requestId, employee: { companyId } },
  });

  if (!request) {
    const err = new Error("Leave request not found");
    err.status = 404;
    throw err;
  }

  if (request.status !== "pending") {
    const err = new Error("Leave request is not pending");
    err.status = 400;
    throw err;
  }

  const [updated] = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        approverId: user.employeeId,
        approvalComment: comment || null,
        decidedAt: new Date(),
      },
    });

    await tx.leaveApprovalHistory.create({
      data: {
        leaveRequestId: requestId,
        actorId: user.employeeId,
        action: "rejected",
        comment: comment || null,
      },
    });

    const balance = await tx.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: request.startDate.getFullYear(),
        },
      },
    });

    if (balance) {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: { decrement: Number(request.totalDays) },
        },
      });
    }

    return [updatedRequest];
  });

  return updated;
}

export async function cancelRequest(companyId, user, requestId, { reason }) {
  const request = await prisma.leaveRequest.findFirst({
    where: { id: requestId, employee: { companyId } },
  });

  if (!request) {
    const err = new Error("Leave request not found");
    err.status = 404;
    throw err;
  }

  if (request.employeeId !== user.employeeId) {
    const err = new Error("You can only cancel your own leave requests");
    err.status = 403;
    throw err;
  }

  if (!["pending", "approved"].includes(request.status)) {
    const err = new Error("Leave request cannot be cancelled in its current state");
    err.status = 400;
    throw err;
  }

  const [updated] = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: "cancelled",
        approvalComment: reason || null,
        decidedAt: new Date(),
      },
    });

    await tx.leaveApprovalHistory.create({
      data: {
        leaveRequestId: requestId,
        actorId: user.employeeId,
        action: "cancelled",
        comment: reason || null,
      },
    });

    const balance = await tx.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: request.startDate.getFullYear(),
        },
      },
    });

    if (balance && request.status === "approved") {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          usedDays: { decrement: Number(request.totalDays) },
        },
      });
    } else if (balance && request.status === "pending") {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: { decrement: Number(request.totalDays) },
        },
      });
    }

    return [updatedRequest];
  });

  return updated;
}

export async function getMyBalance(companyId, employeeId) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!employee) {
    const err = new Error("Employee not found");
    err.status = 404;
    throw err;
  }

  return prisma.leaveBalance.findMany({
    where: { employeeId },
    include: {
      leaveType: { select: { id: true, name: true } },
    },
  });
}

export async function getEmployeeBalance(companyId, targetEmployeeId) {
  const employee = await prisma.employee.findFirst({
    where: { id: targetEmployeeId, companyId },
  });
  if (!employee) {
    const err = new Error("Employee not found");
    err.status = 404;
    throw err;
  }

  return prisma.leaveBalance.findMany({
    where: { employeeId: targetEmployeeId },
    include: {
      leaveType: { select: { id: true, name: true } },
    },
  });
}

export async function getCalendar(companyId, user, month, year) {
  const targetMonth = month ?? new Date().getMonth() + 1;
  const targetYear = year ?? new Date().getFullYear();

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const isSelfAccess = user.roleName === "employee";

  const where = {
    status: "approved",
    startDate: { lte: endDate },
    endDate: { gte: startDate },
    employee: { companyId },
    ...(isSelfAccess && { employeeId: user.employeeId }),
  };

  return prisma.leaveRequest.findMany({
    where,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      leaveType: { select: { name: true } },
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { startDate: "asc" },
  });
}
