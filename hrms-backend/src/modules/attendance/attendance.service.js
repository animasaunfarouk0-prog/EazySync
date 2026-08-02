import prisma from "../../config/prisma.js";

const LATE_AFTER_HOUR = 9;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function nextDay(date) {
  const d = startOfDay(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}

function timeToDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      const [, h, m, s] = match;
      return new Date(1970, 0, 1, Number(h), Number(m), Number(s || 0));
    }
    return new Date(value);
  }
  return new Date(value);
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

export async function clockIn(companyId, employeeId) {
  await assertEmployeeInCompany(companyId, employeeId);

  const now = new Date();
  const day = startOfDay(now);
  const existing = await prisma.attendanceRecord.findFirst({
    where: { employeeId, date: { gte: day, lt: nextDay(now) } },
  });

  if (existing?.clockIn) {
    const err = new Error("Already clocked in today");
    err.status = 409;
    throw err;
  }

  const status = now.getHours() >= LATE_AFTER_HOUR ? "late" : "present";

  if (existing) {
    return prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { status, clockIn: now },
    });
  }

  return prisma.attendanceRecord.create({
    data: { employeeId, date: day, status, clockIn: now },
  });
}

export async function clockOut(companyId, employeeId) {
  await assertEmployeeInCompany(companyId, employeeId);

  const now = new Date();
  const day = startOfDay(now);
  const existing = await prisma.attendanceRecord.findFirst({
    where: { employeeId, date: { gte: day, lt: nextDay(now) } },
  });

  if (!existing || !existing.clockIn) {
    const err = new Error("You must clock in before clocking out");
    err.status = 400;
    throw err;
  }

  return prisma.attendanceRecord.update({
    where: { id: existing.id },
    data: { clockOut: now },
  });
}

export async function createAttendanceRecord(companyId, data) {
  await assertEmployeeInCompany(companyId, data.employeeId);

  const date = new Date(data.date);
  const day = startOfDay(date);
  const existing = await prisma.attendanceRecord.findFirst({
    where: { employeeId: data.employeeId, date: { gte: day, lt: nextDay(date) } },
  });
  if (existing) {
    const err = new Error("An attendance record already exists for this date");
    err.status = 409;
    throw err;
  }

  return prisma.attendanceRecord.create({
    data: {
      employeeId: data.employeeId,
      date: day,
      status: data.status,
      clockIn: timeToDate(data.clockIn),
      clockOut: timeToDate(data.clockOut),
    },
  });
}

export async function listAttendance(companyId, filters = {}) {
  const { status, from, to, departmentId, employeeId, month, year } = filters;

  const dateFilter = {};
  if (month && year) {
    dateFilter.gte = new Date(Number(year), Number(month) - 1, 1);
    dateFilter.lt = new Date(Number(year), Number(month), 1);
  } else {
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      dateFilter.lt = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1);
    }
  }

  return prisma.attendanceRecord.findMany({
    where: {
      employee: {
        companyId,
        ...(departmentId && { departmentId: Number(departmentId) }),
      },
      ...(employeeId && { employeeId: Number(employeeId) }),
      ...(status && { status }),
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getAttendanceRecord(companyId, user, recordId) {
  const record = await prisma.attendanceRecord.findFirst({
    where: { id: recordId, employee: { companyId } },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, employeeCode: true },
      },
    },
  });

  if (!record) {
    const err = new Error("Attendance record not found");
    err.status = 404;
    throw err;
  }

  const isSelf = record.employeeId === user.employeeId;
  if (user.roleName === "employee" && !isSelf) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return record;
}

export async function updateAttendanceRecord(companyId, recordId, data) {
  const record = await prisma.attendanceRecord.findFirst({
    where: { id: recordId, employee: { companyId } },
  });
  if (!record) {
    const err = new Error("Attendance record not found");
    err.status = 404;
    throw err;
  }

  return prisma.attendanceRecord.update({
    where: { id: recordId },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.clockIn !== undefined && { clockIn: timeToDate(data.clockIn) }),
      ...(data.clockOut !== undefined && { clockOut: timeToDate(data.clockOut) }),
    },
  });
}
