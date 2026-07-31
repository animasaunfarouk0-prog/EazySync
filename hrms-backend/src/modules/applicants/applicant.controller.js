import {
  applyToJobService,
  getApplicantsByJobService,
  getApplicantService,
  getOwnApplicantService,
  getMyApplicationsService,
  updateApplicantStatusService,
} from "./applicant.service.js";

// POST /public/jobs/:jobId/apply — public (optionally authenticated)
export const applyToJob = async (req, res, next) => {
  try {
    const resumeUrl = req.file ? "/" + req.file.path.replace(/\\/g, "/") : null;
    const applicant = await applyToJobService({
      jobId: Number(req.params.jobId),
      userId: req.user?.id ?? null,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      coverLetter: req.body.coverLetter,
      resumeUrl,
    });
    res.status(201).json(applicant);
  } catch (error) {
    next(error);
  }
};

// GET /jobs/:jobId/applicants — hr_admin, manager
export const getApplicantsByJob = async (req, res, next) => {
  try {
    const applicants = await getApplicantsByJobService(
      Number(req.params.jobId),
      req.user.companyId
    );
    res.status(200).json(applicants);
  } catch (error) {
    next(error);
  }
};

// GET /applicants/:id — hr_admin, manager
export const getApplicantById = async (req, res, next) => {
  try {
    const applicant = await getApplicantService(
      Number(req.params.id),
      req.user.companyId
    );
    res.status(200).json(applicant);
  } catch (error) {
    next(error);
  }
};

// PATCH /applicants/:id/status — hr_admin, manager
export const updateApplicantStatus = async (req, res, next) => {
  try {
    const applicant = await updateApplicantStatusService(
      Number(req.params.id),
      req.user.companyId,
      req.body.status
    );
    res.status(200).json(applicant);
  } catch (error) {
    next(error);
  }
};

// GET /public/applicants/me — applicant (own applications list)
export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await getMyApplicationsService(req.user.id);
    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

// GET /public/applicants/me/:id — applicant (own single application)
export const getMyApplicationById = async (req, res, next) => {
  try {
    const applicant = await getOwnApplicantService(
      Number(req.params.id),
      req.user.id
    );
    res.status(200).json(applicant);
  } catch (error) {
    next(error);
  }
};
