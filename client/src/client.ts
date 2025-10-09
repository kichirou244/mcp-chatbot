import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export class MCPClient {
  private client: Client;
  private transport: SSEClientTransport | null = null;

  constructor() {
    this.client = new Client(
      { name: "mcp-client", version: "1.0.0" },
      { capabilities: {} }
    );
  }

  async connect(url: string): Promise<void> {
    this.transport = new SSEClientTransport(new URL(url));
    await this.client.connect(this.transport);
  }

  async listTools(): Promise<any> {
    return await this.client.listTools();
  }

  async listResources(): Promise<any> {
    return await this.client.listResources();
  }

  async disconnect(): Promise<void> {
    if (this.transport) await this.client.close();
  }
}

export const mcpClient = new MCPClient();
