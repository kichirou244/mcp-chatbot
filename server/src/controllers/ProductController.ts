import { Request, Response } from "express";
import { IProduct } from "../models/Product";
import { createServices } from "../services";

export class ProductController {
  private services = createServices();

  getProducts = async (_: Request, res: Response): Promise<IProduct[]> => {
    try {
      const products = await this.services.productService.getProducts();
      res.status(200).json(products);

      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };
}
