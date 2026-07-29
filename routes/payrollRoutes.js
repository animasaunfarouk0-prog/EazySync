import express from "express";
import {
    getPayrolls,
    getPayrollById,
    createPayroll,
    updatePayroll,
    deletePayroll,         
} from "../controllers/payrollController.js";

const router = express.Router();    

router.get("/", getPayrolls);
router.get("/:id", getPayrollById);
router.post("/", createPayroll);
router.put("/:id", updatePayroll);
router.delete("/:id", deletePayroll);   

export default router;