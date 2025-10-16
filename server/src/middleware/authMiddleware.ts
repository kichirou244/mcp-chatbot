import { Request, Response, NextFunction } from "express";
import { JwtUtility } from "../utils/jwtUtility";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }

  try {
    const decoded = JwtUtility.verifyToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    console.error("[Auth Middleware] Token verification failed:", err);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};
