import "dotenv/config";

export const jwtConfig = {
  secret: process.env.JWT_SECRET || "secretKey",
};
