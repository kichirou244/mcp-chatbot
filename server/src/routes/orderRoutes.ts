import express from "express";
import { OrderController } from "../controllers/OrderController";

const orderController = new OrderController();

const router = express.Router();

router.get("/", orderController.getOrders);
router.get("/top-products", orderController.getTopProducts);
router.get("/top-users", orderController.getTopUsers);
router.get("/monthly-revenue", orderController.getMonthlyRevenue);
router.get("/by-product/:productId", orderController.getOrdersByProduct);
router.get("/by-user/:userId", orderController.getOrdersByUser);
router.get("/:id", orderController.getOrderById);
router.post("/", orderController.createOrder);
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);

export default router;
