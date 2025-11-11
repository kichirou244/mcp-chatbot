import { Request, Response } from "express";
import { IProduct } from "../database/models";
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

  getProductById = async (
    req: Request,
    res: Response
  ): Promise<IProduct | null> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid product ID" });
      return null;
    }
    try {
      const product = await this.services.productService.getProductById(id);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
      }
      res.status(200).json(product);
      return product;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  createProduct = async (
    req: Request,
    res: Response
  ): Promise<IProduct | null> => {
    const productData = req.body as Omit<IProduct, "id">;

    if (
      !productData.name ||
      !productData.description ||
      productData.price == null ||
      !productData.outletId
    ) {
      res.status(400).json({ error: "Missing required product fields" });
      return null;
    }

    try {
      const newProduct = await this.services.productService.createProduct(
        productData
      );
      res.status(201).json(newProduct);
      return newProduct;
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  updateProduct = async (
    req: Request,
    res: Response
  ): Promise<IProduct | null> => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid product ID" });
      return null;
    }
    const productData = req.body as Partial<IProduct>;
    try {
      const updatedProduct = await this.services.productService.updateProduct(
        id,
        productData
      );
      res.status(200).json(updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error(`Error updating product with ID ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };

  deleteProduct = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid product ID" });
      return;
    }

    try {
      await this.services.productService.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting product with ID ${id}:`, error);
      res.status(500).json({ error: "Internal server error" });
      throw error;
    }
  };
}
