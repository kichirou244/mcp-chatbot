import { sequelize } from "../config/sequelize";
import { Order, IOrderResponse } from "../models/Order";
import { OrderDetail } from "../models/OrderDetail";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { AppError } from "../utils/errors";
import { UserService } from "./UserService";
import { Op, QueryTypes } from "sequelize";

const userService = new UserService();

export class OrderService {
  async createOrder(
    userId: number | null,
    items: Array<{ productId: number; quantity: number }>,
    guestInfo?: { name: string; phone: string; address: string }
  ) {
    const transaction = await sequelize.transaction();

    try {
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

        const guestUser = await User.create(
          {
            username: `guest_${Date.now()}`,
            password: "",
            name: guestInfo.name,
            phone: guestInfo.phone,
            address: guestInfo.address,
          },
          { transaction }
        );
        orderUserId = guestUser.id;
      }

      let totalAmount = 0;
      const orderDetails = [];

      for (const item of items) {
        const product = await Product.findByPk(item.productId, {
          transaction,
        });

        if (!product) {
          throw new AppError(
            `Sản phẩm có ID ${item.productId} không tồn tại`,
            404
          );
        }

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

      const order = await Order.create(
        {
          userId: orderUserId!,
          outletId: 1,
          date: new Date(),
          totalAmount,
        },
        { transaction }
      );

      for (const detail of orderDetails) {
        await OrderDetail.create(
          {
            orderId: order.id,
            productId: detail.productId,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
          },
          { transaction }
        );

        await Product.decrement(
          { quantity: detail.quantity },
          {
            where: { id: detail.productId },
            transaction,
          }
        );
      }

      await transaction.commit();

      return {
        orderId: order.id,
        userId: orderUserId,
        totalAmount,
        orderDetails,
        status: "PENDING",
      };
    } catch (error) {
      await transaction.rollback();

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`Failed to create order: ${error}`, 500);
    }
  }

  async getOrders(): Promise<IOrderResponse[]> {
    try {
      const orders = await Order.findAll({
        include: [
          {
            model: OrderDetail,
            as: "orderDetails",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["name", "description", "outletId"],
              },
            ],
          },
        ],
        order: [["date", "DESC"]],
      });

      return orders.map((order) => {
        const orderJSON = order.toJSON() as any;
        return {
          orderId: orderJSON.id,
          userId: orderJSON.userId,
          totalAmount: orderJSON.totalAmount,
          date: orderJSON.date,
          status: orderJSON.status,
          orderDetails: (orderJSON.orderDetails || []).map((detail: any) => ({
            id: detail.id,
            orderId: detail.orderId,
            productId: detail.productId,
            productName: detail.product?.name || "",
            productDescription: detail.product?.description || "",
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            subtotal: detail.unitPrice * detail.quantity,
            outletId: detail.product?.outletId || 0,
          })),
        };
      });
    } catch (error) {
      throw new AppError(`Failed to retrieve orders: ${error}`, 500);
    }
  }

  async getOrderById(orderId: number): Promise<IOrderResponse | null> {
    try {
      const order = await Order.findByPk(orderId, {
        include: [
          {
            model: OrderDetail,
            as: "orderDetails",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["name", "description", "outletId"],
              },
            ],
          },
        ],
      });

      if (!order) {
        return null;
      }

      const orderJSON = order.toJSON() as any;
      return {
        orderId: orderJSON.id,
        userId: orderJSON.userId,
        totalAmount: orderJSON.totalAmount,
        date: orderJSON.date,
        status: orderJSON.status,
        orderDetails: (orderJSON.orderDetails || []).map((detail: any) => ({
          id: detail.id,
          orderId: detail.orderId,
          productId: detail.productId,
          productName: detail.product?.name || "",
          productDescription: detail.product?.description || "",
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          subtotal: detail.unitPrice * detail.quantity,
          outletId: detail.product?.outletId || 0,
        })),
      };
    } catch (error) {
      throw new AppError(`Failed to retrieve order: ${error}`, 500);
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
    const transaction = await sequelize.transaction();

    try {
      const existingOrder = await Order.findByPk(orderId, { transaction });
      if (!existingOrder) {
        throw new AppError("Đơn hàng không tồn tại", 404);
      }

      if (updateData.status) {
        await existingOrder.update(
          { status: updateData.status },
          { transaction }
        );
      }

      if (updateData.orderDetails) {
        const currentDetails = await OrderDetail.findAll({
          where: { orderId },
          transaction,
        });

        for (const detail of currentDetails) {
          await Product.increment(
            { quantity: detail.quantity },
            {
              where: { id: detail.productId },
              transaction,
            }
          );
        }

        await OrderDetail.destroy({
          where: { orderId },
          transaction,
        });

        let totalAmount = 0;
        for (const detail of updateData.orderDetails) {
          const product = await Product.findByPk(detail.productId, {
            transaction,
          });

          if (!product) {
            throw new AppError(
              `Sản phẩm có ID ${detail.productId} không tồn tại`,
              404
            );
          }

          if (product.quantity < detail.quantity) {
            throw new AppError(
              `Sản phẩm "${product.name}" không đủ số lượng. Còn lại: ${product.quantity}, yêu cầu: ${detail.quantity}`,
              400
            );
          }

          await OrderDetail.create(
            {
              orderId,
              productId: detail.productId,
              quantity: detail.quantity,
              unitPrice: detail.unitPrice,
            },
            { transaction }
          );

          await Product.decrement(
            { quantity: detail.quantity },
            {
              where: { id: detail.productId },
              transaction,
            }
          );

          totalAmount += detail.unitPrice * detail.quantity;
        }

        await existingOrder.update({ totalAmount }, { transaction });
      }

      await transaction.commit();

      const updatedOrder = await this.getOrderById(orderId);
      if (!updatedOrder) {
        throw new AppError(
          "Không thể lấy thông tin đơn hàng sau khi cập nhật",
          500
        );
      }

      return updatedOrder;
    } catch (error) {
      await transaction.rollback();

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`Failed to update order: ${error}`, 500);
    }
  }

  async deleteOrder(orderId: number): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const orderDetails = await OrderDetail.findAll({
        where: { orderId },
        transaction,
      });

      for (const detail of orderDetails) {
        await Product.increment(
          { quantity: detail.quantity },
          {
            where: { id: detail.productId },
            transaction,
          }
        );
      }

      await OrderDetail.destroy({
        where: { orderId },
        transaction,
      });

      const deletedCount = await Order.destroy({
        where: { id: orderId },
        transaction,
      });

      if (deletedCount === 0) {
        throw new AppError("Đơn hàng không tồn tại", 404);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`Failed to delete order: ${error}`, 500);
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
    try {
      const results = await sequelize.query(
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
         LIMIT :limit`,
        {
          replacements: { limit },
          type: QueryTypes.SELECT,
        }
      );

      return results as any;
    } catch (error) {
      throw new AppError(`Failed to get top products: ${error}`, 500);
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
    try {
      const results = await sequelize.query(
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
         LIMIT :limit`,
        {
          replacements: { limit },
          type: QueryTypes.SELECT,
        }
      );

      return results as any;
    } catch (error) {
      throw new AppError(`Failed to get top users: ${error}`, 500);
    }
  }

  async getOrdersByProduct(productId: number): Promise<IOrderResponse[]> {
    try {
      const orders = await Order.findAll({
        include: [
          {
            model: OrderDetail,
            as: "orderDetails",
            where: { productId },
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["name", "description", "outletId"],
              },
            ],
          },
        ],
        where: { status: { [Op.ne]: "CANCELLED" } },
        order: [["date", "DESC"]],
      });

      return orders.map((order) => {
        const orderJSON = order.toJSON() as any;
        return {
          orderId: orderJSON.id,
          userId: orderJSON.userId,
          totalAmount: orderJSON.totalAmount,
          date: orderJSON.date,
          status: orderJSON.status,
          orderDetails: (orderJSON.orderDetails || []).map((detail: any) => ({
            id: detail.id,
            orderId: detail.orderId,
            productId: detail.productId,
            productName: detail.product?.name || "",
            productDescription: detail.product?.description || "",
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            subtotal: detail.unitPrice * detail.quantity,
            outletId: detail.product?.outletId || 0,
          })),
        };
      });
    } catch (error) {
      throw new AppError(`Failed to get orders for product: ${error}`, 500);
    }
  }

  async getOrdersByUser(userId: number): Promise<IOrderResponse[]> {
    try {
      const orders = await Order.findAll({
        where: {
          userId,
          status: { [Op.ne]: "CANCELLED" },
        },
        include: [
          {
            model: OrderDetail,
            as: "orderDetails",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["name", "description", "outletId"],
              },
            ],
          },
        ],
        order: [["date", "DESC"]],
      });

      return orders.map((order) => {
        const orderJSON = order.toJSON() as any;
        return {
          orderId: orderJSON.id,
          userId: orderJSON.userId,
          totalAmount: orderJSON.totalAmount,
          date: orderJSON.date,
          status: orderJSON.status,
          orderDetails: (orderJSON.orderDetails || []).map((detail: any) => ({
            id: detail.id,
            orderId: detail.orderId,
            productId: detail.productId,
            productName: detail.product?.name || "",
            productDescription: detail.product?.description || "",
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            subtotal: detail.unitPrice * detail.quantity,
            outletId: detail.product?.outletId || 0,
          })),
        };
      });
    } catch (error) {
      throw new AppError(`Failed to get orders for user: ${error}`, 500);
    }
  }

  async getMonthlyRevenue(): Promise<
    Array<{
      period: string;
      totalRevenue: number;
      orderCount: number;
    }>
  > {
    try {
      const results = await sequelize.query(
        `SELECT 
           YEAR(date) AS year,
           MONTH(date) AS month,
           SUM(total_amount) AS totalRevenue,
           COUNT(*) AS orderCount
         FROM orders
         WHERE status != 'CANCELLED'
         GROUP BY YEAR(date), MONTH(date)
         ORDER BY year ASC, month ASC`,
        {
          type: QueryTypes.SELECT,
        }
      );

      const aggregated = results as Array<{
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
    }
  }
}
