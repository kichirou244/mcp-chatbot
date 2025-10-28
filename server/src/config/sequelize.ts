import { Sequelize } from "sequelize-typescript";
import "dotenv/config";
import path from "path";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { OrderDetail } from "../models/OrderDetail";
import { Product } from "../models/Product";
import { Outlet } from "../models/Outlet";
import { ChatSession, SessionOrder, ChatMessage } from "../models/ChatSession";

export const sequelize = new Sequelize({
  database: process.env.DB_DATABASE,
  dialect: "mysql",
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  logging: true,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export async function testDbConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối MySQL với Sequelize thành công!");

    sequelize.addModels([
      User,
      Order,
      OrderDetail,
      Product,
      Outlet,
      ChatSession,
      SessionOrder,
      ChatMessage,
    ]);

    const associationsModule = await import("../config/associations");
    associationsModule.setupAssociations();
  } catch (error) {
    console.error("❌ Lỗi kết nối MySQL:", error);
    throw new Error("Không thể kết nối với cơ sở dữ liệu.");
  }
}

export async function syncDatabase(force: boolean = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    console.log("✅ Database sync thành công!");
  } catch (error) {
    console.error("❌ Lỗi sync database:", error);
    throw error;
  }
}
