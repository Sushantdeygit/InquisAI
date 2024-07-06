import { getFeedback } from "../controllers/feedback.controller.js";
import express from "express";
const router = express.Router();

router.route("/feedback").post(getFeedback);

export default router;
