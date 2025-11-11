import { Sequelize } from "sequelize-typescript";
import "dotenv/config";

import { User } from "../database/models/User";
import { Outlet } from "../database/models/Outlet";
import { Product } from "../database/models/Product";
import { Order } from "../database/models/Order";
import { OrderDetail } from "../database/models/OrderDetail";
import {
  ChatSession,
  ChatMessage,
  SessionOrder,
} from "../database/models/ChatSession";
import config from "./config/config";

const env = (process.env.NODE_ENV || "development") as keyof typeof config;
const dbConfig = config[env];

if (!dbConfig) {
  throw new Error(`No database configuration found for environment: ${env}`);
}

export const sequelize = new Sequelize({
  database: dbConfig.database,
  dialect: "mysql",
  username: dbConfig.username,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  models: [
    User,
    Outlet,
    Product,
    Order,
    OrderDetail,
    ChatSession,
    ChatMessage,
    SessionOrder,
  ],
});

export async function testDbConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối MySQL với Sequelize thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MySQL:", error);
    throw new Error("Không thể kết nối với cơ sở dữ liệu.");
  }
}

export async function syncDatabase(options?: {
  force?: boolean;
  alter?: boolean;
}): Promise<void> {
  try {
    await sequelize.sync(options);
    console.log("✅ Database đã được sync!");
  } catch (error) {
    console.error("❌ Lỗi sync database:", error);
    throw error;
  }
}

export {
  User,
  Outlet,
  Product,
  Order,
  OrderDetail,
  ChatSession,
  ChatMessage,
  SessionOrder,
};
