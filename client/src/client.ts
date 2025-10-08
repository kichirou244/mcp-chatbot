import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { IProduct } from "./types/Product";
import type { ICreateOrderRequest } from "./types/Order";
import type { ILoginRequest, IRegisterRequest } from "./types/Auth";
import type { IToolResponse } from "./types/Global";

export class MCPClient {
  private client: Client;
  private transport: SSEClientTransport | null = null;

  constructor() {
    this.client = new Client(
      {
        name: "mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
  }

  async connect(url: string): Promise<void> {
    console.log("[CLIENT] Connecting to:", url);

    this.transport = new SSEClientTransport(new URL(url));

    await this.client.connect(this.transport);
    console.log("[CLIENT] Connected successfully");
  }

  async listResources(): Promise<any> {
    try {
      console.log("[CLIENT] Listing all resources");
      const response = await this.client.listResources();
      console.log("[CLIENT] Resources:", response);
      return response.resources;
    } catch (error) {
      console.error("[CLIENT] Error listing resources:", error);
      throw error;
    }
  }

  async getProducts(): Promise<IProduct[]> {
    try {
      console.log("[CLIENT] Requesting products resource");

      const response = await this.client.readResource({
        uri: "resource://products",
      });

      console.log("[CLIENT] Response received:", response);

      if (!response.contents || response.contents.length === 0) {
        return [];
      }

      const products: IProduct[] = response.contents.map((content: any) => {
        const productData = JSON.parse(content.text);
        return productData;
      });

      return products;
    } catch (error) {
      console.error("[CLIENT] Error fetching products:", error);
      throw error;
    }
  }

  async listTools(): Promise<any> {
    try {
      console.log("[CLIENT] Listing all tools");
      const response = await this.client.listTools();
      console.log("[CLIENT] Tools:", response);
      return response.tools;
    } catch (error) {
      console.error("[CLIENT] Error listing tools:", error);
      throw error;
    }
  }

  private async callTool(name: string, args: any): Promise<IToolResponse> {
    try {
      console.log(`[CLIENT] Calling tool: ${name}`, args);

      const response = await this.client.callTool({
        name,
        arguments: args,
      });

      console.log(`[CLIENT] Tool response:`, response);

      const content = response.content as any;
      if (content && Array.isArray(content) && content.length > 0) {
        const firstContent = content[0];
        if (firstContent.type === "text") {
          return JSON.parse(firstContent.text);
        }
      }

      return { success: false, error: "Invalid response format" };
    } catch (error: any) {
      console.error(`[CLIENT] Error calling tool ${name}:`, error);
      return { success: false, error: error.message || "Tool call failed" };
    }
  }

  async login(credentials: ILoginRequest): Promise<IToolResponse> {
    return this.callTool("login", credentials);
  }

  async register(userData: IRegisterRequest): Promise<IToolResponse> {
    return this.callTool("register", userData);
  }

  async searchProducts(question: string): Promise<IToolResponse> {
    return this.callTool("search_products", { question });
  }

  async createOrder(orderData: ICreateOrderRequest): Promise<IToolResponse> {
    return this.callTool("create_order", orderData);
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
      console.log("[CLIENT] Disconnected");
    }
  }
}

export const mcpClient = new MCPClient();
