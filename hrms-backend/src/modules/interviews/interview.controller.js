import {scheduleInterviewService, getInterviewsByApplicantService, updateInterviewService,} from "./interview.service.js";

// POST /applicants/:id/interviews — hr_admin
export const createInterview = async (req, res) => {
  try {
    const interview = await scheduleInterviewService(Number(req.params.id), {
      scheduledAt: req.body.scheduledAt,
      mode: req.body.mode,
      interviewerId: req.body.interviewerId ?? req.user.employeeId,
    });
    res.status(201).json(interview);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// GET /applicants/:id/interviews — hr_admin, manager
export const getInterviewsByApplicant = async (req, res) => {
  try {
    const interviews = await getInterviewsByApplicantService(Number(req.params.id));
    res.status(200).json(interviews);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// PATCH /interviews/:id — hr_admin
export const updateInterview = async (req, res) => {
  try {
    const interview = await updateInterviewService(Number(req.params.id), req.body);
    res.status(200).json(interview);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};