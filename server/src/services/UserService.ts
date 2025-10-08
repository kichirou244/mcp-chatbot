import { dbPool } from "../config/database";
import { IUser } from "../models/User";
import { AppError } from "../utils/errors";

export class UserService {
  async getUserById(userId: number): Promise<IUser | null> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query(
        "SELECT * FROM users WHERE id = ?",
        [userId]
      );
      const users = rows as IUser[];

      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw new AppError(`Error fetching user: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }
}
