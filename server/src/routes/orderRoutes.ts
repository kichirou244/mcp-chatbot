import express from "express";
import { OrderController } from "../controllers/OrderController";

const orderController = new OrderController();

const router = express.Router();

router.get("/", orderController.getOrders);

export default router;