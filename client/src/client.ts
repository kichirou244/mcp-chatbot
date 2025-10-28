import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

export class MCPClient {
  private client: Client;
  private transport: SSEClientTransport | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.client = new Client(
      { name: "mcp-client", version: "1.0.0" },
      { capabilities: {} }
    );
  }

  async connect(url: string = `${BASE_URL}/connect`): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.isConnected) {
      return;
    }

    this.connectionPromise = (async () => {
      try {
        this.transport = new SSEClientTransport(new URL(url));
        await this.client.connect(this.transport);
        this.isConnected = true;
      } catch (error) {
        this.connectionPromise = null;
        throw error;
      }
    })();

    return this.connectionPromise;
  }

  async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    await this.ensureConnected();
    return await this.client.callTool({ name, arguments: args });
  }

  async listTools(): Promise<any> {
    await this.ensureConnected();
    return await this.client.listTools();
  }

  async listResources(): Promise<any> {
    await this.ensureConnected();
    return await this.client.listResources();
  }

  getClient(): Client {
    return this.client;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.transport && this.isConnected) {
      try {
        await this.client.close();
        this.isConnected = false;
        this.connectionPromise = null;
        console.log("[MCP Client] Disconnected");
      } catch (error) {
        console.error("[MCP Client] Error during disconnect:", error);
      }
    }
  }
}

export const mcpClient = new MCPClient();
