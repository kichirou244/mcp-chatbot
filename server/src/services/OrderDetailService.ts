import { dbPool } from "../config/database";
import { IOrderDetailCreate } from "../models/OrderDetail";
import { AppError } from "../utils/errors";
import { ProductService } from "./ProductService";

const productService = new ProductService();

export class OrderDetailService {
  async saveOrderDetail(formData: IOrderDetailCreate) {
    let connection;
    const { orderId, productId, quantity, unitPrice } = formData;

    try {
      connection = await dbPool.getConnection();

      const product = await productService.getProductById(productId);
      if (!product) {
        throw new AppError("Product not found", 404);
      }

      const sql = `INSERT INTO order_details (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`;
      const [result] = await connection.execute(sql, [
        orderId,
        productId,
        quantity,
        unitPrice,
      ]);

      return result;
    } catch (error) {
      throw new AppError(`Failed to save order detail: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }
}
