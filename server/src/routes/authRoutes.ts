import express from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

const authController = new AuthController();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authenticateToken, authController.getMe);

export default router;
