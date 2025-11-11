import { Request, Response } from "express";
import { createServices } from "../services";
import { IOrderResponse } from "../database/models";

export class OrderController {
  private services = createServices();

  getOrders = async (_: Request, res: Response): Promise<IOrderResponse[]> => {
    try {
      const orders = await this.services.orderService.getOrders();

      res.status(200).json(orders);

      return orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  getOrderById = async (
    req: Request,
    res: Response
  ): Promise<IOrderResponse | null> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid order ID" });
      return null;
    }
    try {
      const order = await this.services.orderService.getOrderById(id);
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return null;
      }
      res.status(200).json(order);
      return order;
    } catch (error) {
      console.error(`Error fetching order with ID ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  createOrder = async (
    req: Request,
    res: Response
  ): Promise<IOrderResponse | null> => {
    const orderData = req.body;

    if (
      !orderData.userId ||
      !orderData.orderDetails ||
      orderData.orderDetails.length === 0
    ) {
      res.status(400).json({ error: "Missing required order fields" });
      return null;
    }

    try {
      const items = orderData.orderDetails.map((detail: any) => ({
        productId: detail.productId,
        quantity: detail.quantity,
      }));

      const newOrder = await this.services.orderService.createOrder(
        orderData.userId,
        items
      );

      const completeOrder = await this.services.orderService.getOrderById(
        newOrder.orderId
      );

      res.status(201).json(completeOrder);
      return completeOrder;
    } catch (error: any) {
      console.error("Error creating order:", error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
      throw error;
    }
  };

  updateOrder = async (
    req: Request,
    res: Response
  ): Promise<IOrderResponse | null> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid order ID" });
      return null;
    }
    const updateData = req.body;
    try {
      const updatedOrder = await this.services.orderService.updateOrder(
        id,
        updateData
      );
      res.status(200).json(updatedOrder);
      return updatedOrder;
    } catch (error: any) {
      console.error(`Error updating order with ID ${id}:`, error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
      throw error;
    }
  };

  deleteOrder = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }
    try {
      await this.services.orderService.deleteOrder(id);
      res.status(204).send();
    } catch (error: any) {
      console.error(`Error deleting order with ID ${id}:`, error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
      throw error;
    }
  };

  getTopProducts = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 5;

      if (isNaN(limit) || limit < 1) {
        res.status(400).json({ error: "Invalid limit parameter" });
        return;
      }

      const topProducts = await this.services.orderService.getTopProducts(
        limit
      );
      res.status(200).json(topProducts);
    } catch (error: any) {
      console.error("Error fetching top products:", error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  };

  getTopUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 5;

      if (isNaN(limit) || limit < 1) {
        res.status(400).json({ error: "Invalid limit parameter" });
        return;
      }

      const topUsers = await this.services.orderService.getTopUsers(limit);
      res.status(200).json(topUsers);
    } catch (error: any) {
      console.error("Error fetching top users:", error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  };

  getOrdersByProduct = async (req: Request, res: Response): Promise<void> => {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) {
      res.status(400).json({ error: "Invalid product ID" });
      return;
    }

    try {
      const orders = await this.services.orderService.getOrdersByProduct(
        productId
      );
      res.status(200).json(orders);
    } catch (error: any) {
      console.error(`Error fetching orders for product ${productId}:`, error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  };

  getOrdersByUser = async (req: Request, res: Response): Promise<void> => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    try {
      const orders = await this.services.orderService.getOrdersByUser(userId);
      res.status(200).json(orders);
    } catch (error: any) {
      console.error(`Error fetching orders for user ${userId}:`, error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  };

  getMonthlyRevenue = async (_: Request, res: Response): Promise<void> => {
    try {
      const revenueData = await this.services.orderService.getMonthlyRevenue();
      res.status(200).json(revenueData);
    } catch (error: any) {
      console.error("Error fetching monthly revenue:", error);
      res.status(error.statusCode || 500).json({
        error: error.message || "Internal server error",
      });
    }
  };
}
