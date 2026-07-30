import express from "express";
import {
    getLeaveRequests,
    getLeaveRequestById,
    createLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,             
} from "../controllers/leaveController.js";

const router = express.Router();

router.get("/", getLeaveRequests);
router.get("/:id", getLeaveRequestById);
router.post("/", createLeaveRequest);
router.put("/:id", updateLeaveRequest);
router.delete("/:id", deleteLeaveRequest);

export default router;  
    