import { Request, Response } from "express";
import { createServices } from "../services";
import { IOrderResponse } from "../models/Order";

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
}
