import { dbPool } from "../config/database";
import { IOrder } from "../models/Order";
import { IProduct } from "../models/Product";
import { AppError } from "../utils/errors";
import { UserService } from "./UserService";

const userService = new UserService();

export class OrderService {
  async createOrder(
    userId: number | null,
    items: Array<{ productId: number; quantity: number }>,
    guestInfo?: { name: string; phone: string; address: string }
  ) {
    let connection;
    try {
      connection = await dbPool.getConnection();
      await connection.beginTransaction();

      let orderUserId: number | null = userId;

      if (userId) {
        const user = await userService.getUserById(userId);
        if (!user) {
          throw new AppError("Người dùng không tồn tại", 404);
        }
        orderUserId = userId;
      } else {
        if (
          !guestInfo ||
          !guestInfo.name ||
          !guestInfo.phone ||
          !guestInfo.address
        ) {
          throw new AppError(
            "Thông tin khách hàng không đầy đủ. Cần có: name, phone, address",
            400
          );
        }

        const [guestResult] = await connection.query(
          "INSERT INTO users (username, password, name, phone, address) VALUES (?, ?, ?, ?, ?)",
          [
            `guest_${Date.now()}`,
            "",
            guestInfo.name,
            guestInfo.phone,
            guestInfo.address,
          ]
        );
        orderUserId = (guestResult as any).insertId;
      }

      let totalAmount = 0;
      const orderDetails = [];

      for (const item of items) {
        const [productRows] = await connection.query(
          "SELECT * FROM products WHERE id = ?",
          [item.productId]
        );
        const products = productRows as IProduct[];

        if (products.length === 0) {
          throw new AppError(
            `Sản phẩm có ID ${item.productId} không tồn tại`,
            404
          );
        }

        const product = products[0];

        if (product.quantity < item.quantity) {
          throw new AppError(
            `Sản phẩm "${product.name}" không đủ số lượng. Còn lại: ${product.quantity}, yêu cầu: ${item.quantity}`,
            400
          );
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderDetails.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal: itemTotal,
        });
      }

      const [orderResult] = (await connection.execute(
        "INSERT INTO `orders` (user_id, date, total_amount, status) VALUES (?, NOW(), ?, 'PENDING')",
        [orderUserId, totalAmount]
      )) as any;

      const orderId = orderResult.insertId;

      for (const detail of orderDetails) {
        await connection.execute(
          "INSERT INTO order_details (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
          [orderId, detail.productId, detail.quantity, detail.unitPrice]
        );

        await connection.execute(
          "UPDATE products SET quantity = quantity - ? WHERE id = ?",
          [detail.quantity, detail.productId]
        );
      }

      await connection.commit();

      return {
        orderId,
        userId: orderUserId,
        totalAmount,
        orderDetails,
        status: "PENDING",
      };
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`Failed to create order: ${error}`, 500);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async getOrders() {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [orderRows] = await connection.query(`
        SELECT u.*, o.*, od.*, p.*
        FROM orders o
        JOIN order_details od ON o.id = od.order_id
        JOIN products p ON od.product_id = p.id
        JOIN users u ON o.user_id = u.id
      `);
      const orders = orderRows as IOrder[];

      return orders;
    } catch (error) {
      throw new AppError(`Failed to get orders: ${error}`, 500);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}
