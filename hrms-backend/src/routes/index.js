const express = require("express");
const router = express.Router();

// abayomi — Foundation
router.use("/auth", require("../modules/auth/auth.routes"));
router.use("/companies", require("../modules/companies/company.routes"));
router.use("/departments", require("../modules/departments/department.routes"));
router.use("/employees", require("../modules/employees/employee.routes"));

module.exports = router;
