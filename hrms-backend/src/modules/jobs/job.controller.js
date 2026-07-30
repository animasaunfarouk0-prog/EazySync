import {
  createJobService,
  listJobsService,
  getJobService,
  updateJobService,
  deleteJobService,
} from "./job.service.js";

// POST /jobs — hr_admin
export const createJob = async (req, res) => {
  try {
    const job = await createJobService({
      companyId: req.user.companyId,
      departmentId: req.body.departmentId,
      postedById: req.user.employeeId,
      title: req.body.title,
      description: req.body.description,
      requirements: req.body.requirements,
      location: req.body.location,
      employmentType: req.body.employmentType,
      status: req.body.status,
    });
    res.status(201).json(job);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// GET /jobs — hr_admin, manager
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await listJobsService({ companyId: req.user.companyId });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// GET /public/jobs — public
export const getPublicJobs = async (req, res) => {
  try {
    const jobs = await listJobsService({ status: "open" });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// GET /jobs/:id and GET /public/jobs/:id
export const getJobById = async (req, res) => {
  try {
    const job = await getJobService(Number(req.params.id));
    res.status(200).json(job);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// PATCH /jobs/:id — hr_admin
export const updateJob = async (req, res) => {
  try {
    const job = await updateJobService(Number(req.params.id), req.body);
    res.status(200).json(job);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

// DELETE /jobs/:id — hr_admin
export const deleteJob = async (req, res) => {
  try {
    await deleteJobService(Number(req.params.id));
    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};