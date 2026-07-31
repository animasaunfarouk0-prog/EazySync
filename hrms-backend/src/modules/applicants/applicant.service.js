import prisma from "../../config/prisma.js";

const APPLICANT_TRANSITIONS = {
  new: ["in_review", "rejected"],
  in_review: ["shortlisted", "rejected"],
  shortlisted: ["interviewed", "rejected"],
  interviewed: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
};

export const assertValidApplicantTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return;
  const allowed = APPLICANT_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    const err = new Error(`Cannot move applicant from '${currentStatus}' to '${nextStatus}'`);
    err.statusCode = 400;
    throw err;
  }
};

const getApplicantWithCompany = async (id) => {
  return prisma.applicant.findUnique({
    where: { id },
    include: { job: true, interviews: true },
  });
};

const assertApplicantInCompany = (applicant, companyId) => {
  if (!applicant) {
    const err = new Error("Applicant not found");
    err.statusCode = 404;
    throw err;
  }
  if (applicant.job.companyId !== companyId) {
    const err = new Error("Applicant not found");
    err.statusCode = 404;
    throw err;
  }
  return applicant;
};

export const applyToJobService = async ({
  jobId,
  userId,
  firstName,
  lastName,
  email,
  phoneNumber,
  coverLetter,
  resumeUrl,
}) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    const err = new Error("Job not found");
    err.statusCode = 404;
    throw err;
  }
  if (job.status !== "open") {
    const err = new Error("This job is not currently accepting applications");
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.applicant.findFirst({ where: { email, jobId } });
  if (existing) {
    const err = new Error("You have already applied to this job");
    err.statusCode = 409;
    throw err;
  }

  return prisma.applicant.create({
    data: {
      jobId,
      userId: userId ?? null,
      firstName,
      lastName,
      email,
      phoneNumber,
      coverLetter,
      resumeUrl,
    },
  });
};

export const getApplicantsByJobService = async (jobId, companyId) => {
  const job = await prisma.job.findFirst({ where: { id: jobId, companyId } });
  if (!job) {
    const err = new Error("Job not found");
    err.statusCode = 404;
    throw err;
  }

  return prisma.applicant.findMany({
    where: { jobId },
    include: { job: true },
    orderBy: { appliedAt: "desc" },
  });
};

export const getApplicantService = async (id, companyId) => {
  if (!companyId) {
    const err = new Error("Company context required");
    err.statusCode = 400;
    throw err;
  }
  return assertApplicantInCompany(await getApplicantWithCompany(id), companyId);
};

export const getOwnApplicantService = async (id, userId) => {
  const applicant = await getApplicantWithCompany(id);
  if (!applicant || applicant.userId !== userId) {
    const err = new Error("Applicant not found");
    err.statusCode = 404;
    throw err;
  }
  return applicant;
};

export const getMyApplicationsService = (userId) =>
  prisma.applicant.findMany({
    where: { userId },
    include: { job: true },
    orderBy: { appliedAt: "desc" },
  });

export const updateApplicantStatusService = async (id, companyId, nextStatus) => {
  const applicant = await getApplicantWithCompany(id);
  assertApplicantInCompany(applicant, companyId);

  assertValidApplicantTransition(applicant.status, nextStatus);
  return prisma.applicant.update({ where: { id }, data: { status: nextStatus } });
};
