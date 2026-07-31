import prisma from "../../config/prisma.js";

export async function employeeSummary(companyId, filters = {}) {
  const { departmentId } = filters;

  const where = {
    companyId,
    ...(departmentId && { departmentId: Number(departmentId) }),
  };

  const [totalEmployees, activeEmployees, departmentDistribution, goalStats] =
    await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.count({ where: { ...where, status: "active" } }),
      prisma.employee.groupBy({
        by: ["departmentId"],
        where,
        _count: { id: true },
      }),
      prisma.goal.aggregate({
        where: { employee: { companyId } },
        _avg: { progress: true },
        _count: true,
      }),
    ]);

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees: totalEmployees - activeEmployees,
    departmentDistribution,
    averageGoalProgress: goalStats._avg?.progress ?? 0,
    totalGoals: goalStats._count,
  };
}

export async function departmentSummary(companyId) {
  const departments = await prisma.department.findMany({
    where: { companyId },
    include: {
      _count: { select: { employees: true, goals: true } },
      head: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const departmentRatings = await Promise.all(
    departments.map(async (dept) => {
      const avgRating = await prisma.performanceReview.aggregate({
        where: {
          employee: { departmentId: dept.id },
          feedbackStatus: "submitted",
        },
        _avg: { overallRating: true },
      });

      return {
        ...dept,
        averageReviewRating: avgRating._avg?.overallRating ?? null,
      };
    })
  );

  return departmentRatings;
}

export async function leaveReport(companyId, filters = {}) {
  const { from, to, departmentId } = filters;
  const startDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = to ? new Date(to) : new Date();

  const where = {
    employee: { companyId, ...(departmentId && { departmentId: Number(departmentId) }) },
    submittedAt: { gte: startDate, lte: endDate },
  };

  const [totalRequests, byStatus, byType, averageDuration] =
    await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),
      prisma.leaveRequest.groupBy({
        by: ["leaveTypeId"],
        where,
        _count: { id: true },
        _sum: { totalDays: true },
      }),
      prisma.leaveRequest.aggregate({
        where: { ...where, status: "approved" },
        _avg: { totalDays: true },
      }),
    ]);

  return {
    totalRequests,
    byStatus,
    byType,
    averageApprovedDuration: averageDuration._avg?.totalDays ?? 0,
  };
}

export async function attendanceReport(companyId, filters = {}) {
  const { from, to, departmentId } = filters;
  const startDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = to ? new Date(to) : new Date();

  const where = {
    employee: { companyId, ...(departmentId && { departmentId: Number(departmentId) }) },
    date: { gte: startDate, lte: endDate },
  };

  const [summary, monthlyTrend] = await Promise.all([
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
  ]);

  return {
    period: { from: startDate, to: endDate },
    summary,
    monthlyTrend,
  };
}

export async function recruitmentReport(companyId, filters = {}) {
  const { from, to } = filters;
  const startDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const endDate = to ? new Date(to) : new Date();

  const [jobStats, applicantStats, recentApplicants, interviewStats] =
    await Promise.all([
      prisma.job.groupBy({
        by: ["status"],
        where: { companyId, createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      prisma.applicant.groupBy({
        by: ["status"],
        where: { job: { companyId }, appliedAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      prisma.applicant.findMany({
        where: { job: { companyId }, appliedAt: { gte: startDate, lte: endDate } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          appliedAt: true,
          job: { select: { title: true, jobCode: true } },
        },
        orderBy: { appliedAt: "desc" },
        take: 20,
      }),
      prisma.interview.aggregate({
        where: { applicant: { job: { companyId } }, createdAt: { gte: startDate, lte: endDate } },
        _count: true,
        _avg: { rating: true },
      }),
    ]);

  const jobDistribution = Object.fromEntries(
    jobStats.map((s) => [s.status, s._count.id])
  );
  const applicantDistribution = Object.fromEntries(
    applicantStats.map((s) => [s.status, s._count.id])
  );

  return {
    period: { from: startDate, to: endDate },
    jobs: {
      total: jobStats.reduce((sum, s) => sum + s._count.id, 0),
      byStatus: jobDistribution,
    },
    applicants: {
      total: applicantStats.reduce((sum, s) => sum + s._count.id, 0),
      byStatus: applicantDistribution,
      recent: recentApplicants,
    },
    interviews: {
      total: interviewStats._count,
      averageRating: interviewStats._avg?.rating ?? null,
    },
  };
}

export async function payrollSummary(companyId, filters = {}) {
  const { month, year, departmentId } = filters;
  const targetMonth = month ?? new Date().getMonth() + 1;
  const targetYear = year ?? new Date().getFullYear();

  const where = {
    employee: { companyId, ...(departmentId && { departmentId: Number(departmentId) }) },
    month: targetMonth,
    year: targetYear,
  };

  const [totalPayslips, totals, byStatus] = await Promise.all([
    prisma.payslip.count({ where }),
    prisma.payslip.aggregate({
      where,
      _sum: { grossEarnings: true, netSalary: true, taxDeduction: true, pensionDeduction: true, nhfDeduction: true },
      _avg: { grossEarnings: true, netSalary: true },
    }),
    prisma.payslip.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
  ]);

  return {
    month: targetMonth,
    year: targetYear,
    totalPayslips,
    totals: {
      grossEarnings: totals._sum?.grossEarnings ?? 0,
      netSalary: totals._sum?.netSalary ?? 0,
      taxDeduction: totals._sum?.taxDeduction ?? 0,
      pensionDeduction: totals._sum?.pensionDeduction ?? 0,
      nhfDeduction: totals._sum?.nhfDeduction ?? 0,
    },
    averages: {
      grossEarnings: totals._avg?.grossEarnings ?? 0,
      netSalary: totals._avg?.netSalary ?? 0,
    },
    byStatus,
  };
}

export async function adminDashboard(companyId) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    employeeCounts,
    pendingLeaveCount,
    departmentCount,
    reviewsThisMonth,
    attendanceToday,
  ] = await Promise.all([
    prisma.employee.groupBy({
      by: ["status"],
      where: { companyId },
      _count: { id: true },
    }),
    prisma.leaveRequest.count({
      where: { employee: { companyId }, status: "pending" },
    }),
    prisma.department.count({ where: { companyId } }),
    prisma.performanceReview.count({
      where: {
        employee: { companyId },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.attendanceRecord.count({
      where: {
        employee: { companyId },
        date: today,
        status: "present",
      },
    }),
  ]);

  return {
    employeeCounts,
    pendingLeaveCount,
    departmentCount,
    reviewsThisMonth,
    attendanceToday,
  };
}
