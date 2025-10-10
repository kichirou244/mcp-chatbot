import express from "express";
import { AuthController } from "../controllers/AuthController";

const router = express.Router();

const authController = new AuthController();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authController.getMe);

export default router;
