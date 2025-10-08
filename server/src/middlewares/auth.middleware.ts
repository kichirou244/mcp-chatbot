import { NextFunction, Request, Response } from "express";
import { JwtUtility } from "../utils/jwtUtility";

export interface AuthenticatedRequest extends Request {
  user?: { id: number; username: string };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decode = JwtUtility.verifyToken(token);
    req.user = { id: decode.id, username: decode.username };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
