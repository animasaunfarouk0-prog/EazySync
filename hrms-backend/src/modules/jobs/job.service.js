import prisma from "../../config/prisma.js";

const JOB_TRANSITIONS = {
  draft: ["open"],
  open: ["on_hold", "closed"],
  on_hold: ["open", "closed"],
  closed: [],
};

export const assertValidJobTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return;
  const allowed = JOB_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    const err = new Error(`Cannot move job from '${currentStatus}' to '${nextStatus}'`);
    err.statusCode = 400;
    throw err;
  }
};

const generateJobCode = async (companyId) => {
  const lastJob = await prisma.job.findFirst({
    where: { companyId },
    orderBy: { jobCode: "desc" },
  });

  let nextNumber = 1;
  if (lastJob?.jobCode) {
    const match = lastJob.jobCode.match(/(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  return `JOB-${String(nextNumber).padStart(4, "0")}`;
};

const JOB_INCLUDE = {
  department: true,
  postedBy: true,
  _count: { select: { applicants: true } },
};

export const createJobService = async (data) => {
  const jobCode = await generateJobCode(data.companyId);
  return prisma.job.create({
    data: { ...data, jobCode },
  });
};

export const listJobsService = (where = {}) =>
  prisma.job.findMany({
    where,
    include: JOB_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

export const getJobService = async (id, { companyId, publicOnly = false } = {}) => {
  const where = { id };
  if (publicOnly) {
    where.status = "open";
  } else if (companyId) {
    where.companyId = companyId;
  } else {
    const err = new Error("Company context required");
    err.statusCode = 400;
    throw err;
  }

  const job = await prisma.job.findFirst({
    where,
    include: JOB_INCLUDE,
  });

  if (!job) {
    const err = new Error("Job not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    ...job,
    applicantsCount: job._count?.applicants ?? 0,
  };
};

export const updateJobService = async (id, companyId, data) => {
  const existing = await prisma.job.findFirst({
    where: { id, companyId },
  });
  if (!existing) {
    const err = new Error("Job not found");
    err.statusCode = 404;
    throw err;
  }

  if (data.status) {
    assertValidJobTransition(existing.status, data.status);
  }

  return prisma.job.update({ where: { id }, data });
};

export const deleteJobService = async (id, companyId) => {
  const existing = await prisma.job.findFirst({
    where: { id, companyId },
  });
  if (!existing) {
    const err = new Error("Job not found");
    err.statusCode = 404;
    throw err;
  }
  return prisma.job.delete({ where: { id } });
};
