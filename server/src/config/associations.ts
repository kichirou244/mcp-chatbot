import { ChatSession, SessionOrder } from "../models/ChatSession";
import { Order } from "../models/Order";
import { OrderDetail } from "../models/OrderDetail";
import { Outlet } from "../models/Outlet";
import { Product } from "../models/Product";
import { User } from "../models/User";

export function setupAssociations() {
  User.hasMany(Order, { foreignKey: "userId", as: "orders" });
  User.hasMany(ChatSession, { foreignKey: "userId", as: "chatSessions" });

  Order.belongsTo(User, { foreignKey: "userId", as: "user" });
  Order.hasMany(OrderDetail, { foreignKey: "orderId", as: "orderDetails" });

  OrderDetail.belongsTo(Order, { foreignKey: "orderId", as: "order" });
  OrderDetail.belongsTo(Product, { foreignKey: "productId", as: "product" });

  Product.belongsTo(Outlet, { foreignKey: "outletId", as: "outlet" });
  Product.hasMany(OrderDetail, { foreignKey: "productId", as: "orderDetails" });

  Outlet.hasMany(Product, { foreignKey: "outletId", as: "products" });

  ChatSession.belongsTo(User, { foreignKey: "userId", as: "user" });
  ChatSession.hasMany(SessionOrder, { foreignKey: "sessionId", as: "sessionOrders" });

  SessionOrder.belongsTo(ChatSession, { foreignKey: "sessionId", as: "session" });
  SessionOrder.belongsTo(Order, { foreignKey: "orderId", as: "order" });
}
