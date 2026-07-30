import {
  applyToJobService,
  getApplicantsByJobService,
  getApplicantService,
  getMyApplicationsService,
  updateApplicantStatusService,
} from "./applicant.service.js";

// POST /public/jobs/:jobId/apply — public (optionally authenticated)
export const applyToJob = async (req, res) => {
  try {
    const applicant = await applyToJobService({
      jobId: Number(req.params.jobId),
      userId: req.user?.id ?? null,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      coverLetter: req.body.coverLetter,
      resumeUrl: req.file?.path,
    });
    res.status(201).json(applicant);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// GET /jobs/:jobId/applicants — hr_admin, manager
export const getApplicantsByJob = async (req, res) => {
  try {
    const applicants = await getApplicantsByJobService(Number(req.params.jobId));
    res.status(200).json(applicants);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// GET /applicants/:id — hr_admin, manager
export const getApplicantById = async (req, res) => {
  try {
    const applicant = await getApplicantService(Number(req.params.id));
    res.status(200).json(applicant);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// PATCH /applicants/:id/status — hr_admin, manager
export const updateApplicantStatus = async (req, res) => {
  try {
    const applicant = await updateApplicantStatusService(Number(req.params.id), req.body.status);
    res.status(200).json(applicant);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// GET /public/applicants/me — applicant (own applications list)
export const getMyApplications = async (req, res) => {
  try {
    const applications = await getMyApplicationsService(req.user.id);
    res.status(200).json(applications);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// GET /public/applicants/me/:id — applicant (own single application)
export const getMyApplicationById = async (req, res) => {
  try {
    const applicant = await getApplicantService(Number(req.params.id));
    if (applicant.userId !== req.user.id) {
      return res.status(403).json({ message: "You cannot view this application" });
    }
    res.status(200).json(applicant);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};