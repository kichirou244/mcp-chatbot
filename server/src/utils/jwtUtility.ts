import * as jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt";

export class JwtUtility {
  static generateToken(userId: number, username: string): string {
    const payload = { id: userId, username: username };
    return jwt.sign(payload, jwtConfig.secret, { algorithm: "HS256" });
  }

  static verifyToken(token: string): any {
    return jwt.verify(token, jwtConfig.secret as jwt.Secret);
  }

  static decodeToken(token: string): string {
    const decoded = jwt.decode(token) as { id?: number } | null;
    return decoded && typeof decoded.id === "number"
      ? decoded.id.toString()
      : "";
  }

  static getUnauthorizedError(): string {
    return JSON.stringify(
      { success: false, error: "Unauthorized: Invalid or missing token" },
      null,
      2
    );
  }
}
