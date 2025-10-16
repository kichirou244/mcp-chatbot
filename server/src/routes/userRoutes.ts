import { UserController } from "../controllers/UserController";
import express from "express";

const userController = new UserController();

const router = express.Router();

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);

export default router;
