import {scheduleInterviewService, getInterviewsByApplicantService, updateInterviewService,} from "./interview.service.js";

// POST /applicants/:id/interviews — hr_admin
export const createInterview = async (req, res, next) => {
  try {
    const interview = await scheduleInterviewService(
      Number(req.params.id),
      {
        scheduledAt: req.body.scheduledAt,
        mode: req.body.mode,
        interviewerId: req.body.interviewerId ?? req.user.employeeId,
      },
      req.user.companyId
    );
    res.status(201).json(interview);
  } catch (error) {
    next(error);
  }
};

// GET /applicants/:id/interviews — hr_admin, manager
export const getInterviewsByApplicant = async (req, res, next) => {
  try {
    const interviews = await getInterviewsByApplicantService(
      Number(req.params.id),
      req.user.companyId
    );
    res.status(200).json(interviews);
  } catch (error) {
    next(error);
  }
};

// PATCH /interviews/:id — hr_admin
export const updateInterview = async (req, res, next) => {
  try {
    const interview = await updateInterviewService(
      Number(req.params.id),
      req.user.companyId,
      req.body
    );
    res.status(200).json(interview);
  } catch (error) {
    next(error);
  }
};
