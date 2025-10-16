import { dbPool } from "../config/database";
import { IOrder, IOrderResponse } from "../models/Order";
import { IOrderDetailResponse } from "../models/OrderDetail";
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

  async getOrders(): Promise<IOrderResponse[]> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [orderRows] = await connection.query(
        "SELECT id, user_id AS userId, date, total_amount AS totalAmount, status FROM orders"
      );
      const orders = orderRows as IOrder[];

      const [detailRows] = await connection.query(
        `SELECT od.id, od.order_id AS orderId, od.product_id AS productId, od.quantity, od.unit_price AS unitPrice, p.name AS productName, p.description AS productDescription
         FROM order_details od
         LEFT JOIN products p ON od.product_id = p.id`
      );

      const orderDetails = detailRows as Array<IOrderDetailResponse>;

      const ordersWithDetails: IOrderResponse[] = orders.map((o) => {
        const detailsForOrder = orderDetails
          .filter((d) => d.orderId === o.id)
          .map((d) => ({
            id: d.id,
            productId: d.productId,
            productName: d.productName,
            productDescription: d.productDescription,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            subtotal: d.unitPrice * d.quantity,
          }));

        return {
          orderId: o.id,
          userId: o.userId,
          totalAmount: o.totalAmount,
          date: o.date,
          status: o.status,
          orderDetails: detailsForOrder,
        } as IOrderResponse;
      });

      return ordersWithDetails;
    } catch (error) {
      throw new AppError(`Failed to retrieve orders: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }
}
