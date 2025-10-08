import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServices } from "./services/index.js";
import { McpResourcesHandler } from "./services/McpResourcesHandler.js";
import { McpToolsHandler } from "./services/McpToolsHandler.js";
import cors from "cors";

import aiRoutes from "./routes/aiRoutes";
const services = createServices();

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

const resourcesHandler = new McpResourcesHandler(server, services);
resourcesHandler.registerAll();

const toolsHandler = new McpToolsHandler(server, services);
toolsHandler.registerAll();

const transports: { [sessionId: string]: SSEServerTransport } = {};

const app = express();
app.use(cors());
app.use(express.json());

const router = express.Router();

const POST_ENDPOINT = "/messages";

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
app.use("/ai", aiRoutes);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
  console.log(`✅ Registered 4 tools`);
  console.log(`✅ Registered 1 resource`);
});
