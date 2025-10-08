import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createServices } from "./index.js";

export class McpResourcesHandler {
  constructor(
    private server: Server,
    private services: ReturnType<typeof createServices>
  ) {}

  registerAll(): void {
    this.registerListHandler();
    this.registerReadHandler();
  }

  private registerListHandler(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: "resource://products",
            name: "products",
            description: "Danh sách các sản phẩm",
            mimeType: "application/json",
          },
          {
            uri: "resource://orders",
            name: "orders",
            description: "Danh sách các đơn hàng",
            mimeType: "application/json",
          },
        ],
      };
    });
  }

  private registerReadHandler(): void {
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const uri = request.params.uri;

        if (uri === "resource://products") {
          console.log("[SERVER] Resource products read request");
          const products = await this.services.productService.getProducts();
          console.log("[SERVER] Products fetched:", products);

          return {
            contents: products.map((product) => ({
              uri: `resource://products/${product.id}`,
              text: JSON.stringify(product),
              mimeType: "application/json",
            })),
          };
        }

        if (uri === "resource://orders") {
          console.log("[SERVER] Resource orders read request");
          const orders = await this.services.orderService.getOrders();
          console.log("[SERVER] Orders fetched:", orders);

          return {
            contents: orders.map((order) => ({
              uri: `resource://orders/${order.id}`,
              text: JSON.stringify(order),
              mimeType: "application/json",
            })),
          };
        }

        throw new Error(`Unknown resource: ${uri}`);
      }
    );
  }
}
