import { dbPool } from "../config/database";
import { IProduct, IProductWithOutlet } from "../models/Product";
import { AppError } from "../utils/errors";
import { OutletService } from "./OutletService";

const outletServices = new OutletService();

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

  async getProductsOutlets(): Promise<IProductWithOutlet[]> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query(
        `SELECT p.id, p.name, p.description, p.price, p.outlet_id AS outletId, o.name AS outletName, o.address AS outletAddress
         FROM products p
         JOIN outlets o ON p.outlet_id = o.id`
      );

      return rows as IProductWithOutlet[];
    } catch (error) {
      throw new AppError(`Error fetching products with outlets: ${error}`, 500);
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

  async createProduct(product: Omit<IProduct, "id">): Promise<IProduct> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const { name, description, price, outletId, quantity } = product;

      const outlet = await outletServices.getOutletById(outletId);

      if (!outlet) {
        throw new AppError(`Outlet with ID ${outletId} does not exist`, 400);
      }

      const [result] = await connection.query(
        "INSERT INTO products (name, description, price, outlet_id, quantity) VALUES (?, ?, ?, ?, ?)",
        [name, description, price, outletId, quantity]
      );

      await connection.commit();

      const insertId = (result as any).insertId;

      return {
        id: insertId,
        name,
        description,
        price,
        outletId,
      } as IProduct;
    } catch (error) {
      throw new AppError(`Error creating product: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async updateProduct(
    id: number,
    product: Partial<IProduct>
  ): Promise<IProduct> {
    let connection;
    try {
      connection = await dbPool.getConnection();

      const existingProduct = await this.getProductById(id);
      if (!existingProduct) {
        throw new AppError(`Product with ID ${id} does not exist`, 404);
      }

      if (product.outletId) {
        const outlet = await outletServices.getOutletById(product.outletId);

        if (!outlet) {
          throw new AppError(
            `Outlet with ID ${product.outletId} does not exist`,
            400
          );
        }

        existingProduct.outletId = product.outletId;
      }

      const updatedProduct = {
        ...existingProduct,
        ...product,
      };

      await connection.query(
        "UPDATE products SET name = ?, description = ?, price = ?, outlet_id = ?, quantity = ? WHERE id = ?",
        [
          updatedProduct.name,
          updatedProduct.description,
          updatedProduct.price,
          updatedProduct.outletId,
          updatedProduct.quantity,
          id,
        ]
      );

      return updatedProduct;
    } catch (error) {
      throw new AppError(`Error updating product: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async deleteProduct(id: number): Promise<void> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const product = await this.getProductById(id);

      if (!product) {
        throw new AppError(`Product with ID ${id} does not exist`, 404);
      }

      await connection.query("DELETE FROM products WHERE id = ?", [id]);

      return;
    } catch (error) {
      throw new AppError(`Error deleting product: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }
}
