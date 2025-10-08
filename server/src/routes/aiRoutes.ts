import express from "express";
import { askAi } from "../controllers/AiAgentController";

const router = express.Router();

router.post("/", askAi);

export default router;
