import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import companyRoutes from "../modules/companies/company.routes.js";
import departmentRoutes from "../modules/departments/department.routes.js";
import employeeRoutes from "../modules/employees/employee.routes.js";
// ---- Recruitment module imports ----
import jobRoutes, { publicJobRoutes } from "../modules/jobs/job.routes.js";
import applicantRoutes, { publicApplicantRoutes } from "../modules/applicants/applicant.routes.js";
import interviewRoutes, { applicantInterviewRoutes } from "../modules/interviews/interview.routes.js";

const router = express.Router();

// abayomi — Foundation
router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/departments", departmentRoutes);
router.use("/employees", employeeRoutes);

// ---- Recruitment module routes ---- Animasaun Farouk

router.use("/jobs", jobRoutes);
router.use("/applicants", applicantRoutes);
router.use("/applicants", applicantInterviewRoutes);
router.use("/interviews", interviewRoutes);
router.use("/public/jobs", publicJobRoutes);
router.use("/public", publicApplicantRoutes);

export default router;