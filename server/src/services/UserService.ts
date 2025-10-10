import { dbPool } from "../config/database";
import { IAuthResponse, IUser, IUserDB } from "../models/User";
import { AppError } from "../utils/errors";
import { JwtUtility } from "../utils/jwtUtility";

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

  async getMe(accessToken: string): Promise<IAuthResponse | null> {
    let connection;

    try {
      connection = await dbPool.getConnection();

      const jwt = JwtUtility.verifyToken(accessToken);

      if (!jwt || typeof jwt.id !== "number") {
        throw new AppError("Invalid token", 401);
      }

      const [rows] = await connection.query(
        "SELECT * FROM users WHERE id = ?",
        [jwt.id]
      );
      const users = rows as IUserDB[];

      if (users.length === 0) {
        throw new AppError("User not found", 404);
      }

      const response = {
        id: users[0].id,
        username: users[0].username,
        accessToken: accessToken,
      } as IAuthResponse;

      return response;
    } catch (error) {
      throw new AppError(`Error fetching user: ${error}`, 500);
    }
  }
}
