import { Router } from "express";
import { ChatSessionController } from "../controllers/ChatSessionController";

const router = Router();

router.post("/", ChatSessionController.createSession);
router.post("/:sessionId/message", ChatSessionController.addMessage);
router.get("/:sessionId/history", ChatSessionController.getSessionHistory);
router.get("/stats", ChatSessionController.getSessionStats);
router.put("/:sessionId/end", ChatSessionController.endSession);
router.post("/:sessionId/end", ChatSessionController.endSession);

export default router;
