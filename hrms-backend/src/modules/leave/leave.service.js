import prisma from "../../config/prisma.js";
import { notify } from "../notifications/notification.service.js";

export async function listLeaveTypes(companyId) {
  return prisma.leaveType.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });
}

export async function createLeaveType(companyId, data) {
  const existing = await prisma.leaveType.findFirst({
    where: { companyId, name: data.name },
  });
  if (existing) {
    const err = new Error("Leave type already exists in this company");
    err.status = 409;
    throw err;
  }

  return prisma.leaveType.create({
    data: { companyId, name: data.name, defaultDays: data.defaultDays ?? null },
  });
}

// FIX: now validates leaveTypeId belongs to this company before creating
// a balance against it — previously an hr_admin could point at another
// company's leaveTypeId with no check.
export async function createBalance(companyId, data) {
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, companyId },
  });
  if (!employee) {
    const err = new Error("Employee not found in this company");
    err.status = 404;
    throw err;
  }

  const leaveType = await prisma.leaveType.findFirst({
    where: { id: data.leaveTypeId, companyId },
  });
  if (!leaveType) {
    const err = new Error("Leave type not found in this company");
    err.status = 404;
    throw err;
  }

  const existing = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: data.employeeId,
        leaveTypeId: data.leaveTypeId,
        year: data.year,
      },
    },
  });
  if (existing) {
    const err = new Error(
      "Balance already exists for this employee, leave type, and year"
    );
    err.status = 409;
    throw err;
  }

  return prisma.leaveBalance.create({
    data: {
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      year: data.year,
      totalDays: data.totalDays,
    },
  });
}

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

// FIX: no more silent bypass when no balance exists — now REJECTS the
// request with a clear error instead of letting unlimited, untracked
// leave through. Also now notifies the employee's manager on submission.
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

  if (!balance) {
    const err = new Error(
      "No leave balance set up for this leave type/year. Contact HR to set one up before applying."
    );
    err.status = 400;
    throw err;
  }

  const available =
    Number(balance.totalDays) -
    Number(balance.usedDays) -
    Number(balance.pendingDays);
  if (diffDays > available) {
    const err = new Error(
      `Insufficient leave balance. Available: ${available} days, requested: ${diffDays} days`
    );
    err.status = 400;
    throw err;
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

    await tx.leaveBalance.update({
      where: { id: balance.id },
      data: { pendingDays: { increment: diffDays } },
    });

    return [leaveRequest];
  });

  if (employee.reportsToId) {
    const manager = await prisma.employee.findUnique({
      where: { id: employee.reportsToId },
    });
    if (manager) {
      await notify({
        userId: manager.userId,
        type: "leave_request",
        title: "New leave request",
        message: `${employee.firstName} ${employee.lastName} submitted a leave request for ${diffDays} day(s).`,
        relatedEntityType: "leave_request",
        relatedEntityId: request.id,
      });
    }
  }

  return request;
}

// FIX: now notifies the employee once their request is approved.
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

  const employee = await prisma.employee.findUnique({
    where: { id: updated.employeeId },
  });
  if (employee) {
    await notify({
      userId: employee.userId,
      type: "leave_request",
      title: "Leave request approved",
      message: "Your leave request has been approved.",
      relatedEntityType: "leave_request",
      relatedEntityId: updated.id,
    });
  }

  return updated;
}

// FIX: now notifies the employee once their request is rejected.
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

  const employee = await prisma.employee.findUnique({
    where: { id: updated.employeeId },
  });
  if (employee) {
    await notify({
      userId: employee.userId,
      type: "leave_request",
      title: "Leave request rejected",
      message: `Your leave request was rejected.${
        comment ? ` Reason: ${comment}` : ""
      }`,
      relatedEntityType: "leave_request",
      relatedEntityId: updated.id,
    });
  }

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
    const err = new Error(
      "Leave request cannot be cancelled in its current state"
    );
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
