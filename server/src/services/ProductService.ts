import { dbPool } from "../config/database";
import { IProduct } from "../models/Product";
import { AppError } from "../utils/errors";

export class ProductService {
  async getProducts(): Promise<IProduct[]> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query("SELECT * FROM products");

      const products = (rows as any[]).map((row) => {
        const { outlet_id, ...rest } = row;
        return {
          ...rest,
          outletId: outlet_id,
        };
      }) as IProduct[];

      return products;
    } catch (error) {
      throw new AppError(`Error fetching products: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async getProductById(id: number): Promise<IProduct | null> {
    let connection;
    try {
      connection = await dbPool.getConnection();
      const [rows] = await connection.query(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );

      const products = (rows as any[]).map((row) => ({
        ...row,
        outletId: row.outlet_id,
      })) as IProduct[];

      return products.length > 0 ? products[0] : null;
    } catch (error) {
      throw new AppError(`Error fetching products by ID: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async searchProducts(keyword: string): Promise<IProduct[]> {
    let connection;
    try {
      connection = await dbPool.getConnection();
      const searchTerm = `%${keyword}%`;
      const [rows] = await connection.query(
        "SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
        [searchTerm, searchTerm]
      );

      return rows as IProduct[];
    } catch (error) {
      throw new AppError(`Error searching products: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }
}
