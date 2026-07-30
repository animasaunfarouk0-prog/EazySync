import prisma from "../../config/prisma.js";

export async function listReviews(companyId, user, filters = {}) {
  const { status, reviewType } = filters;
  const isSelfAccess = user.roleName === "employee";

  const where = {
    employee: { companyId },
    ...(isSelfAccess && {
      employeeId: user.employeeId,
      feedbackStatus: "submitted",
    }),
    ...(!isSelfAccess && status && { status }),
    ...(reviewType && { reviewType }),
  };

  return prisma.performanceReview.findMany({
    where,
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
      reviewer: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReviewById(companyId, user, reviewId) {
  const review = await prisma.performanceReview.findFirst({
    where: { id: reviewId, employee: { companyId } },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
      reviewer: {
        select: { id: true, firstName: true, lastName: true },
      },
      goalRatings: {
        include: {
          goal: { select: { id: true, title: true } },
        },
      },
      competencyRatings: true,
    },
  });

  if (!review) {
    const err = new Error("Review not found");
    err.status = 404;
    throw err;
  }

  const isSelf = review.employeeId === user.employeeId;
  const isReviewer = review.reviewerId === user.employeeId;
  const isHrAdmin = user.roleName === "hr_admin";

  if (isSelf && review.feedbackStatus === "draft" && !isHrAdmin) {
    const err = new Error(
      "Review is still in draft. You cannot view it until feedback is submitted."
    );
    err.status = 403;
    throw err;
  }

  if (user.roleName === "employee" && !isSelf) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return review;
}

export async function createReview(companyId, userId, data) {
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, companyId },
  });
  if (!employee) {
    const err = new Error("Employee not found in this company");
    err.status = 404;
    throw err;
  }

  const reviewer = await prisma.employee.findFirst({
    where: { userId, companyId },
  });
  if (!reviewer) {
    const err = new Error("Reviewer profile not found");
    err.status = 404;
    throw err;
  }

  return prisma.performanceReview.create({
    data: {
      employeeId: data.employeeId,
      reviewerId: reviewer.id,
      reviewType: data.reviewType || null,
      reviewPeriodStart: data.reviewPeriodStart || null,
      reviewPeriodEnd: data.reviewPeriodEnd || null,
    },
  });
}

export async function updateReview(companyId, reviewId, data) {
  const review = await prisma.performanceReview.findFirst({
    where: { id: reviewId, employee: { companyId } },
  });

  if (!review) {
    const err = new Error("Review not found");
    err.status = 404;
    throw err;
  }

  return prisma.performanceReview.update({
    where: { id: reviewId },
    data,
  });
}

export async function submitFeedback(companyId, user, reviewId, data) {
  const review = await prisma.performanceReview.findFirst({
    where: { id: reviewId, employee: { companyId } },
  });

  if (!review) {
    const err = new Error("Review not found");
    err.status = 404;
    throw err;
  }

  if (review.reviewerId !== user.employeeId) {
    const err = new Error("Only the assigned reviewer can submit feedback");
    err.status = 403;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    if (data.goalRatings && data.goalRatings.length > 0) {
      for (const gr of data.goalRatings) {
        const employeeRating = gr.employeeRating
          ? Number(gr.employeeRating)
          : null;
        const reviewerRating = gr.reviewerRating
          ? Number(gr.reviewerRating)
          : null;
        let score = null;
        if (employeeRating !== null && reviewerRating !== null) {
          score = Number(((employeeRating + reviewerRating) / 2).toFixed(2));
        } else if (employeeRating !== null) {
          score = employeeRating;
        } else if (reviewerRating !== null) {
          score = reviewerRating;
        }

        await tx.reviewGoalRating.upsert({
          where: {
            reviewId_goalId: {
              reviewId,
              goalId: gr.goalId,
            },
          },
          create: {
            reviewId,
            goalId: gr.goalId,
            employeeRating,
            reviewerRating,
            score,
          },
          update: {
            employeeRating,
            reviewerRating,
            score,
          },
        });
      }
    }

    if (data.competencyRatings && data.competencyRatings.length > 0) {
      await tx.reviewCompetencyRating.deleteMany({
        where: { reviewId },
      });

      for (const cr of data.competencyRatings) {
        await tx.reviewCompetencyRating.create({
          data: {
            reviewId,
            competencyName: cr.competencyName,
            rating: cr.rating || null,
          },
        });
      }
    }

    const competencyAgg = data.competencyRatings?.length
      ? await tx.reviewCompetencyRating.aggregate({
          where: { reviewId },
          _avg: { rating: true },
        })
      : null;

    const goalAgg = data.goalRatings?.length
      ? await tx.reviewGoalRating.aggregate({
          where: { reviewId },
          _avg: { score: true },
        })
      : null;

    const goalAvg = goalAgg?._avg?.score ?? null;
    const competencyAvg = competencyAgg?._avg?.rating ?? null;
    const ratings = [goalAvg, competencyAvg, data.overallRating ?? null].filter(
      (r) => r !== null
    );
    const computedOverall =
      ratings.length > 0
        ? Number(
            (ratings.reduce((sum, r) => sum + Number(r), 0) / ratings.length).toFixed(1)
          )
        : data.overallRating ?? null;

    const updated = await tx.performanceReview.update({
      where: { id: reviewId },
      data: {
        overallRating: computedOverall,
        strengths: data.strengths ?? null,
        areasForImprovement: data.areasForImprovement ?? null,
        additionalComments: data.additionalComments ?? null,
        feedbackStatus: "submitted",
        submittedAt: new Date(),
        status: "completed",
      },
    });

    return updated;
  });
}

export async function saveFeedbackDraft(companyId, user, reviewId, data) {
  const review = await prisma.performanceReview.findFirst({
    where: { id: reviewId, employee: { companyId } },
  });

  if (!review) {
    const err = new Error("Review not found");
    err.status = 404;
    throw err;
  }

  if (review.reviewerId !== user.employeeId) {
    const err = new Error("Only the assigned reviewer can edit feedback");
    err.status = 403;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    if (data.goalRatings && data.goalRatings.length > 0) {
      for (const gr of data.goalRatings) {
        await tx.reviewGoalRating.upsert({
          where: {
            reviewId_goalId: {
              reviewId,
              goalId: gr.goalId,
            },
          },
          create: {
            reviewId,
            goalId: gr.goalId,
            employeeRating: gr.employeeRating ?? null,
            reviewerRating: gr.reviewerRating ?? null,
            score: null,
          },
          update: {
            employeeRating: gr.employeeRating ?? null,
            reviewerRating: gr.reviewerRating ?? null,
          },
        });
      }
    }

    const updated = await tx.performanceReview.update({
      where: { id: reviewId },
      data: {
        strengths: data.strengths ?? null,
        areasForImprovement: data.areasForImprovement ?? null,
        additionalComments: data.additionalComments ?? null,
        feedbackStatus: "draft",
      },
    });

    return updated;
  });
}
