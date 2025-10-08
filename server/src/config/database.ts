import { createPool, Pool, PoolOptions } from "mysql2/promise";
import "dotenv/config";

export const dbConfig: PoolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const dbPool: Pool = createPool(dbConfig);

export async function testDbConnection(): Promise<void> {
  let connection;
  try {
    connection = await dbPool.getConnection();
    await connection.query("SELECT 1 + 1 AS solution");
    console.log("✅ Kết nối MySQL thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MySQL:", error);
    throw new Error("Không thể kết nối với cơ sở dữ liệu.");
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
