import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import companyRoutes from "../modules/companies/company.routes.js";
import departmentRoutes from "../modules/departments/department.routes.js";
import employeeRoutes from "../modules/employees/employee.routes.js";

const router = express.Router();

// abayomi — Foundation
router.use("/auth", authRoutes);
router.use("/companies", companyRoutes);
router.use("/departments", departmentRoutes);
router.use("/employees", employeeRoutes);

export default router;
