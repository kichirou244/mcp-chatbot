import { dbPool } from "../config/database";
import { IUserResponse } from "../models/User";
import { AppError } from "../utils/errors";

export class UserService {
  async getUserById(userId: number): Promise<IUserResponse | null> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query(
        "SELECT * FROM users WHERE id = ?",
        [userId]
      );
      const users = rows as IUserResponse[];

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw new AppError(`Error fetching user: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async getUsers(): Promise<IUserResponse[]> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query("SELECT * FROM users");
      return rows as IUserResponse[];
    } catch (error) {
      throw new AppError(`Error fetching users: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }
}
