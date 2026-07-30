import express from "express";
import {
    getAttendanceRecords,
    getAttendanceRecordById,
    createAttendanceRecord,
    updateAttendanceRecord,
    deleteAttendanceRecord,                     
}
from "../controllers/attendanceController.js";

const router = express.Router();    

router.get("/", getAttendanceRecords);
router.get("/:id", getAttendanceRecordById);
router.post("/", createAttendanceRecord);
router.put("/:id", updateAttendanceRecord);
router.delete("/:id", deleteAttendanceRecord);

export default router;  

