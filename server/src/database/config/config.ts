import "dotenv/config";
import { Dialect } from "sequelize";

interface DatabaseConfig {
  database: string;
  dialect: Dialect;
  username: string;
  password: string;
  host: string;
  port: number;
  logging: boolean;
}

interface Config {
  development: DatabaseConfig;
  test?: DatabaseConfig;
  production?: DatabaseConfig;
}

const config: Config = {
  development: {
    database: process.env.DB_DATABASE || "mcp_db",
    dialect: "mysql" as Dialect,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    logging: false,
  },
};

export default config;
module.exports = config;
