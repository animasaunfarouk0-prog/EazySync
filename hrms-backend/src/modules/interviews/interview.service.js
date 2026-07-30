import prisma from "../../config/prisma.js";

export const scheduleInterviewService = async (applicantId, { scheduledAt, mode, interviewerId }) => {
  const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
  if (!applicant) {
    const err = new Error("Applicant not found");
    err.statusCode = 404;
    throw err;
  }

  const interview = await prisma.interview.create({
    data: {
      applicantId,
      interviewerId,
      scheduledAt: new Date(scheduledAt),
      mode,
    },
  });

  if (["new", "in_review", "shortlisted"].includes(applicant.status)) {
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { status: "interviewed" },
    });
  }

  return interview;
};

export const getInterviewsByApplicantService = async (applicantId) => {
  const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
  if (!applicant) {
    const err = new Error("Applicant not found");
    err.statusCode = 404;
    throw err;
  }

  return prisma.interview.findMany({
    where: { applicantId },
    include: { interviewer: true },
    orderBy: { scheduledAt: "asc" },
  });
};

export const updateInterviewService = async (id, data) => {
  const existing = await prisma.interview.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Interview not found");
    err.statusCode = 404;
    throw err;
  }

  return prisma.interview.update({ where: { id }, data });
};