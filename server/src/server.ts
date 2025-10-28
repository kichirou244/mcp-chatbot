import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from "cors";
import "reflect-metadata";

import authRoutes from "./routes/authRoutes";
import orderRoutes from "./routes/orderRoutes";
import outletRoutes from "./routes/outletRoutes";
import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import chatSessionRoutes from "./routes/chatSessionRoutes";

import { createServices } from "./services/index.js";
import { McpResourcesHandler } from "./services/McpResourcesHandler.js";
import { McpToolsHandler } from "./services/McpToolsHandler.js";
import { testDbConnection } from "./config/sequelize";

const server = new Server(
  {
    name: "mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

const services = createServices();
const resourcesHandler = new McpResourcesHandler(server, services);
const toolsHandler = new McpToolsHandler(server, services);

resourcesHandler.registerAll();
toolsHandler.registerAll();

const transports: { [sessionId: string]: SSEServerTransport } = {};

const app = express();
app.use(cors());
app.use(express.json());

const router = express.Router();

const POST_ENDPOINT = "/messages";

router.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

router.post(POST_ENDPOINT, async (req: Request, res: Response) => {
  console.log("message request received: ", req.body);

  const sessionId = req.query.sessionId;

  if (typeof sessionId != "string") {
    res.status(400).send({ messages: "Bad session id." });
    return;
  }
  const transport = transports[sessionId];
  if (!transport) {
    res.status(400).send({ messages: "No transport found for sessionId." });
    return;
  }

  await transport.handlePostMessage(req, res, req.body);

  return;
});

router.get("/connect", async (req: Request, res: Response) => {
  console.log("connection request received");

  const transport = new SSEServerTransport(POST_ENDPOINT, res);
  console.log("new transport created with session id: ", transport.sessionId);

  transports[transport.sessionId] = transport;

  res.on("close", () => {
    console.log("SSE connection closed");
    delete transports[transport.sessionId];
  });

  await server.connect(transport);

  return;
});

app.use("/", router);
app.use("/auth", authRoutes);
app.use("/order", orderRoutes);
app.use("/outlet", outletRoutes);
app.use("/product", productRoutes);
app.use("/user", userRoutes);
app.use("/chat-session", chatSessionRoutes);

const PORT = 8080;

async function startServer() {
  try {
    await testDbConnection();
    
    app.listen(PORT, () => {
      console.log(`MCP listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
