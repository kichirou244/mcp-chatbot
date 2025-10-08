import { STATUS_CODES } from "http";
import { dbPool } from "../config/database";
import {
  IAuthResponse,
  IUserCreate,
  IUserDB,
  IUserLogin,
} from "../models/User";
import { JwtUtility } from "../utils/jwtUtility";
import { PasswordUtility } from "../utils/passwordUtility";
import { AppError } from "../utils/errors";

export class AuthService {
  async register(formData: IUserCreate): Promise<IAuthResponse> {
    const { username, password, name, phone, address } = formData;
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );

      const existingUser = rows as IUserDB[];

      if (existingUser.length > 0) {
        throw new AppError("Username already exists", 409);
      }

      const passwordHash = await PasswordUtility.hashPassword(password);

      const [result] = await connection.query(
        "INSERT INTO users (username, password, name, phone, address) VALUES (?, ?, ?, ?, ?)",
        [username, passwordHash, name, phone, address]
      );

      const newUserId = (result as any).insertId as number;

      const accessToken = JwtUtility.generateToken(newUserId, username);

      return {
        id: newUserId,
        username: username,
        accessToken,
      };
    } catch (error) {
      throw new AppError(`Registration failed: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }

  async login(formData: IUserLogin): Promise<IAuthResponse> {
    const { username, password } = formData;
    let connection;

    try {
      connection = await dbPool.getConnection();

      const [rows] = await connection.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );

      const user = rows as IUserDB[];

      if (user.length === 0) {
        throw new AppError("Invalid username or password", 401);
      }

      const isPasswordValid = await PasswordUtility.comparePassword(
        password,
        user[0].password
      );

      if (!isPasswordValid) {
        throw new AppError("Invalid username or password", 401);
      }

      const accessToken = JwtUtility.generateToken(user[0].id, username);

      return {
        id: user[0].id,
        username: user[0].username,
        accessToken,
      };
    } catch (error) {
      throw new AppError(`Login failed: ${error}`, 500);
    } finally {
      if (connection) connection.release();
    }
  }
}
