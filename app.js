import express from "express";
import employeeRoutes from "./routes/employeeRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import recruitmentRoutes from "./routes/recruitmentRoutes.js";
const app = express();
const PORT = 5001;

app.use(express.json());
app.use("/employees", employeeRoutes);
app.use("/recruitment", recruitmentRoutes);
app.use("/departments", departmentRoutes);
app.use("/payroll", payrollRoutes);
app.use("/leave", leaveRoutes);
app.use("/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the HR Routing API" });
});

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
});

// app.get("/employees", (req, res) => {
//     const employees = [
//         { id: 1, name: "John Doe", position: "Software Engineer" },
//         { id: 2, name: "Jane Smith", position: "Product Manager" },
//     ];
//     res.status(200).json({ employees });
// });

// app.get("/departments", (req, res) => {
//     const departments = [
//         { id: 1, name: "Engineering" },
//         { id: 2, name: "Marketing" },
//         { id: 3, name: "Sales" },
//     ];
//     res.status(200).json({ departments });
// });

// app.get("/payroll", (req, res) => {
//     res.status(200).json({ message: "Payroll information." });
// });

// app.get("/leave", (req, res) => {
//     res.status(200).json({ message: "Leave management information." });
// });

// app.get("/attendance", (req, res) => {
//     res.status(200).json({ message: "Attendance tracking information." });
// });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
