import express from "express";
import {
    getApplicants,
    getApplicantById,
    createApplicant,
    updateApplicant,
    deleteApplicant,         
} from "../controllers/recruitmentController.js";

const router = express.Router();    

router.get("/", getApplicants);
router.get("/:id", getApplicantById);
router.post("/", createApplicant);
router.put("/:id", updateApplicant);
router.delete("/:id", deleteApplicant);

export default router;  
