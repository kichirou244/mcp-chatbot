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
        `SELECT od.id, od.order_id AS orderId, od.product_id AS productId, od.quantity, od.unit_price AS unitPrice, p.name AS productName, p.description AS productDescription, p.outlet_id AS outletId
         FROM order_details od
         LEFT JOIN products p ON od.product_id = p.id`
      );

      const orderDetails = detailRows as Array<IOrderDetailResponse>;

      const ordersWithDetails: IOrderResponse[] = orders
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((o) => {
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
              outletId: d.outletId,
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

  async getOrderById(orderId: number): Promise<IOrderResponse | null> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [orderRows] = await connection.query(
        "SELECT id, user_id AS userId, date, total_amount AS totalAmount, status FROM orders WHERE id = ?",
        [orderId]
      );
      const orders = orderRows as IOrder[];

      if (orders.length === 0) {
        return null;
      }

      const order = orders[0];

      const [detailRows] = await connection.query(
        `SELECT od.id, od.order_id AS orderId, od.product_id AS productId, od.quantity, od.unit_price AS unitPrice, p.name AS productName, p.description AS productDescription
         FROM order_details od
         LEFT JOIN products p ON od.product_id = p.id
         WHERE od.order_id = ?`,
        [orderId]
      );

      const orderDetails = (detailRows as Array<IOrderDetailResponse>).map(
        (d) => ({
          id: d.id,
          productId: d.productId,
          productName: d.productName,
          productDescription: d.productDescription,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          subtotal: d.unitPrice * d.quantity,
        })
      );

      return {
        orderId: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        date: order.date,
        status: order.status,
        orderDetails,
      } as IOrderResponse;
    } catch (error) {
      throw new AppError(`Failed to retrieve order: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async updateOrder(
    orderId: number,
    updateData: {
      status?: string;
      orderDetails?: Array<{
        id?: number;
        productId: number;
        quantity: number;
        unitPrice: number;
      }>;
    }
  ): Promise<IOrderResponse> {
    let connection;
    try {
      connection = await dbPool.getConnection();
      await connection.beginTransaction();

      const existingOrder = await this.getOrderById(orderId);
      if (!existingOrder) {
        throw new AppError("Đơn hàng không tồn tại", 404);
      }

      if (updateData.status) {
        await connection.execute("UPDATE orders SET status = ? WHERE id = ?", [
          updateData.status,
          orderId,
        ]);
      }

      if (updateData.orderDetails) {
        const [currentDetailsRows] = await connection.query(
          "SELECT product_id AS productId, quantity FROM order_details WHERE order_id = ?",
          [orderId]
        );
        const currentDetails = currentDetailsRows as Array<{
          productId: number;
          quantity: number;
        }>;

        for (const detail of currentDetails) {
          await connection.execute(
            "UPDATE products SET quantity = quantity + ? WHERE id = ?",
            [detail.quantity, detail.productId]
          );
        }

        await connection.execute(
          "DELETE FROM order_details WHERE order_id = ?",
          [orderId]
        );

        let totalAmount = 0;
        for (const detail of updateData.orderDetails) {
          const [productRows] = await connection.query(
            "SELECT * FROM products WHERE id = ?",
            [detail.productId]
          );
          const products = productRows as IProduct[];

          if (products.length === 0) {
            throw new AppError(
              `Sản phẩm có ID ${detail.productId} không tồn tại`,
              404
            );
          }

          const product = products[0];

          if (product.quantity < detail.quantity) {
            throw new AppError(
              `Sản phẩm "${product.name}" không đủ số lượng. Còn lại: ${product.quantity}, yêu cầu: ${detail.quantity}`,
              400
            );
          }

          await connection.execute(
            "INSERT INTO order_details (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
            [orderId, detail.productId, detail.quantity, detail.unitPrice]
          );

          await connection.execute(
            "UPDATE products SET quantity = quantity - ? WHERE id = ?",
            [detail.quantity, detail.productId]
          );

          totalAmount += detail.unitPrice * detail.quantity;
        }

        await connection.execute(
          "UPDATE orders SET total_amount = ? WHERE id = ?",
          [totalAmount, orderId]
        );
      }

      await connection.commit();

      const updatedOrder = await this.getOrderById(orderId);
      if (!updatedOrder) {
        throw new AppError(
          "Không thể lấy thông tin đơn hàng sau khi cập nhật",
          500
        );
      }

      return updatedOrder;
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`Failed to update order: ${error}`, 500);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async deleteOrder(orderId: number): Promise<void> {
    let connection;
    try {
      connection = await dbPool.getConnection();
      await connection.beginTransaction();

      const [detailRows] = await connection.query(
        "SELECT product_id AS productId, quantity FROM order_details WHERE order_id = ?",
        [orderId]
      );
      const orderDetails = detailRows as Array<{
        productId: number;
        quantity: number;
      }>;

      for (const detail of orderDetails) {
        await connection.execute(
          "UPDATE products SET quantity = quantity + ? WHERE id = ?",
          [detail.quantity, detail.productId]
        );
      }

      await connection.execute("DELETE FROM order_details WHERE order_id = ?", [
        orderId,
      ]);

      const [result] = await connection.execute(
        "DELETE FROM orders WHERE id = ?",
        [orderId]
      );

      if ((result as any).affectedRows === 0) {
        throw new AppError("Đơn hàng không tồn tại", 404);
      }

      await connection.commit();
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`Failed to delete order: ${error}`, 500);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async getTopProducts(limit: number = 5): Promise<
    Array<{
      productId: number;
      productName: string;
      productDescription: string;
      totalQuantitySold: number;
      totalRevenue: number;
      orderCount: number;
    }>
  > {
    let connection;
    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query(
        `SELECT 
          p.id AS productId,
          p.name AS productName,
          p.description AS productDescription,
          SUM(od.quantity) AS totalQuantitySold,
          SUM(od.quantity * od.unit_price) AS totalRevenue,
          COUNT(DISTINCT od.order_id) AS orderCount
         FROM order_details od
         INNER JOIN products p ON od.product_id = p.id
         INNER JOIN orders o ON od.order_id = o.id
         WHERE o.status != 'CANCELLED'
         GROUP BY p.id, p.name, p.description
         ORDER BY totalQuantitySold DESC
         LIMIT ?`,
        [limit]
      );

      return rows as Array<{
        productId: number;
        productName: string;
        productDescription: string;
        totalQuantitySold: number;
        totalRevenue: number;
        orderCount: number;
      }>;
    } catch (error) {
      throw new AppError(`Failed to get top products: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async getTopUsers(limit: number = 5): Promise<
    Array<{
      userId: number;
      userName: string;
      userPhone: string;
      userAddress: string;
      totalSpent: number;
      orderCount: number;
      lastOrderDate: Date;
    }>
  > {
    let connection;
    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query(
        `SELECT 
          u.id AS userId,
          u.name AS userName,
          u.phone AS userPhone,
          u.address AS userAddress,
          SUM(o.total_amount) AS totalSpent,
          COUNT(o.id) AS orderCount,
          MAX(o.date) AS lastOrderDate
         FROM orders o
         INNER JOIN users u ON o.user_id = u.id
         WHERE o.status != 'CANCELLED'
         GROUP BY u.id, u.name, u.phone, u.address
         ORDER BY totalSpent DESC
         LIMIT ?`,
        [limit]
      );

      return rows as Array<{
        userId: number;
        userName: string;
        userPhone: string;
        userAddress: string;
        totalSpent: number;
        orderCount: number;
        lastOrderDate: Date;
      }>;
    } catch (error) {
      throw new AppError(`Failed to get top users: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async getOrdersByProduct(productId: number): Promise<IOrderResponse[]> {
    let connection;
    try {
      connection = await dbPool.getConnection();

      const [orderRows] = await connection.query(
        `SELECT DISTINCT o.id, o.user_id AS userId, o.date, o.total_amount AS totalAmount, o.status
         FROM orders o
         INNER JOIN order_details od ON o.id = od.order_id
         WHERE od.product_id = ? AND o.status != 'CANCELLED'
         ORDER BY o.date DESC`,
        [productId]
      );
      const orders = orderRows as IOrder[];

      const orderIds = orders.map((o) => o.id);

      if (orderIds.length === 0) {
        return [];
      }

      const [detailRows] = await connection.query(
        `SELECT od.id, od.order_id AS orderId, od.product_id AS productId, od.quantity, od.unit_price AS unitPrice, p.name AS productName, p.description AS productDescription, p.outlet_id AS outletId
         FROM order_details od
         LEFT JOIN products p ON od.product_id = p.id
         WHERE od.order_id IN (?)`,
        [orderIds]
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
            outletId: d.outletId,
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
      throw new AppError(`Failed to get orders for product: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async getOrdersByUser(userId: number): Promise<IOrderResponse[]> {
    let connection;
    try {
      connection = await dbPool.getConnection();

      const [orderRows] = await connection.query(
        `SELECT id, user_id AS userId, date, total_amount AS totalAmount, status
         FROM orders
         WHERE user_id = ? AND status != 'CANCELLED'
         ORDER BY date DESC`,
        [userId]
      );
      const orders = orderRows as IOrder[];

      if (orders.length === 0) {
        return [];
      }

      const orderIds = orders.map((o) => o.id);

      const [detailRows] = await connection.query(
        `SELECT od.id, od.order_id AS orderId, od.product_id AS productId, od.quantity, od.unit_price AS unitPrice, p.name AS productName, p.description AS productDescription, p.outlet_id AS outletId
         FROM order_details od
         LEFT JOIN products p ON od.product_id = p.id
         WHERE od.order_id IN (?)`,
        [orderIds]
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
            outletId: d.outletId,
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
      throw new AppError(`Failed to get orders for user: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async getMonthlyRevenue(): Promise<
    Array<{
      period: string;
      totalRevenue: number;
      orderCount: number;
    }>
  > {
    let connection;
    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query(
        `SELECT 
           YEAR(date) AS year,
           MONTH(date) AS month,
           SUM(total_amount) AS totalRevenue,
           COUNT(*) AS orderCount
         FROM orders
         WHERE status != 'CANCELLED'
         GROUP BY YEAR(date), MONTH(date)
         ORDER BY year ASC, month ASC`
      );

      const aggregated = rows as Array<{
        year: number;
        month: number;
        totalRevenue: number | string | null;
        orderCount: number | string;
      }>;

      const response = aggregated.map((row) => ({
        period: `${row.year}.${row.month}`,
        totalRevenue: Number(row.totalRevenue ?? 0),
        orderCount: Number(row.orderCount ?? 0),
      }));

      return response;
    } catch (error) {
      throw new AppError(`Failed to get monthly revenue: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }
}
