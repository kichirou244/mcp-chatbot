import express from "express";
import { chat } from "../controllers/McpController";

const router = express.Router();

router.post("/", chat);

export default router;
