import prisma from "../../config/prisma.js";
import { assertValidApplicantTransition } from "../applicants/applicant.service.js";

const getApplicantInCompany = async (applicantId, companyId) => {
  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    include: { job: true },
  });
  if (!applicant || applicant.job.companyId !== companyId) {
    const err = new Error("Applicant not found");
    err.statusCode = 404;
    throw err;
  }
  return applicant;
};

export const scheduleInterviewService = async (applicantId, { scheduledAt, mode, interviewerId }, companyId) => {
  const applicant = await getApplicantInCompany(applicantId, companyId);

  const interview = await prisma.interview.create({
    data: {
      applicantId,
      interviewerId,
      scheduledAt: new Date(scheduledAt),
      mode,
    },
  });

  // Only advance to "interviewed" if the state machine allows it (i.e. from shortlisted).
  // Otherwise HR moves the applicant through the pipeline via PATCH /applicants/:id/status.
  if (applicant.status === "shortlisted") {
    assertValidApplicantTransition(applicant.status, "interviewed");
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { status: "interviewed" },
    });
  }

  return interview;
};

export const getInterviewsByApplicantService = async (applicantId, companyId) => {
  const applicant = await getApplicantInCompany(applicantId, companyId);

  return prisma.interview.findMany({
    where: { applicantId },
    include: { interviewer: true },
    orderBy: { scheduledAt: "asc" },
  });
};

export const updateInterviewService = async (id, companyId, data) => {
  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { applicant: { include: { job: true } } },
  });

  if (!interview || interview.applicant.job.companyId !== companyId) {
    const err = new Error("Interview not found");
    err.statusCode = 404;
    throw err;
  }

  return prisma.interview.update({ where: { id }, data });
};
