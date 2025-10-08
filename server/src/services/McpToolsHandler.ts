import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createServices } from "./index.js";
import { JwtUtility } from "../utils/jwtUtility.js";
import { IProduct } from "../models/Product.js";

export class McpToolsHandler {
  constructor(
    private server: Server,
    private services: ReturnType<typeof createServices>
  ) {}

  registerAll(): void {
    this.registerListHandler();
    this.registerCallHandler();
  }

  private createErrorResponse(message: string) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: false, error: message }, null, 2),
        },
      ],
      isError: true,
    };
  }

  private createSuccessResponse(data: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: true, data }, null, 2),
        },
      ],
    };
  }

  private verifyAccessToken(accessToken: string): number | null {
    try {
      const decoded = JwtUtility.verifyToken(accessToken);
      return decoded.id;
    } catch {
      return null;
    }
  }

  private async parseAIResponse(response: string): Promise<any> {
    const cleaned = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  }

  private async analyzeProductQuery(question: string) {
    const prompt = `Phân tích câu hỏi của người dùng và xác định xem họ có đang muốn tìm kiếm hoặc mua sản phẩm không.
Câu hỏi: "${question}"

Phản hồi bằng một đối tượng JSON với định dạng chính xác sau:
{
  "isProductQuery": true/false,
  "keywords": ["từ khóa 1", "từ khóa 2", ...],
  "intent": "search" hoặc "buy" hoặc "other"
}`;

    const response = await this.services.aiAgent.ask(
      "gemini-2.0-flash",
      prompt
    );
    return this.parseAIResponse(response);
  }

  private async matchProductsByKeywords(
    keywords: string[],
    products: IProduct[]
  ) {
    const productList = products.map((p) => ({ id: p.id, name: p.name }));

    const prompt = `Dựa trên các từ khóa sau, hãy tìm các sản phẩm liên quan trong danh sách.
Từ khóa: ${JSON.stringify(keywords)}
Danh sách sản phẩm (id, name): ${JSON.stringify(productList)}

Chỉ trả về một mảng JSON các ID sản phẩm được sắp xếp theo mức độ liên quan.
Định dạng: [id1, id2, id3, ...]
Nếu không tìm thấy, trả về: []`;

    const response = await this.services.aiAgent.ask(
      "gemini-2.0-flash",
      prompt
    );
    const matchedIds = await this.parseAIResponse(response);

    return matchedIds
      .map((id: number) => products.find((p) => p.id === id))
      .filter((p: any) => p !== undefined);
  }

  private async extractOrderItems(question: string, allProducts: IProduct[]) {
    const prompt = `Phân tích yêu cầu của người dùng và xác định họ có muốn MUA/ĐẶT HÀNG sản phẩm không.

YÊU CẦU: "${question}"

Sản phẩm có sẵn:
${JSON.stringify(
  allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
  }))
)}

QUAN TRỌNG:
- Nếu có từ "mua", "đặt", "order", "đặt hàng" → isBuyIntent = true
- Nếu chỉ hỏi, tìm kiếm → isBuyIntent = false
- Số lượng mặc định là 1 nếu không nói rõ
- Chỉ chọn sản phẩm có trong danh sách

Phản hồi JSON chính xác:
{
  "isBuyIntent": true/false,
  "items": [{"id": 1, "name": "Tên sản phẩm", "quantity": 2}]
}

Ví dụ:
- "Tôi muốn mua laptop" → {"isBuyIntent": true, "items": [{"id": 1, "name": "Laptop", "quantity": 1}]}
- "Có laptop nào không?" → {"isBuyIntent": false, "items": []}`;

    const response = await this.services.aiAgent.ask(
      "gemini-2.0-flash",
      prompt
    );
    return this.parseAIResponse(response);
  }

  private async validateOrderItems(items: any[]) {
    const validatedItems = [];

    for (const item of items) {
      const product = (await this.services.productService.getProductById(
        item.id
      )) as IProduct;

      if (!product) {
        throw new Error(
          `Sản phẩm "${item.name}" (ID: ${item.id}) không tìm thấy.`
        );
      }

      if (product.quantity < item.quantity) {
        throw new Error(
          `Số lượng không đủ cho "${product.name}". Sẵn có: ${product.quantity}, Yêu cầu: ${item.quantity}`
        );
      }

      validatedItems.push({ productId: product.id, quantity: item.quantity });
    }

    return validatedItems;
  }

  private registerListHandler(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_products",
            description:
              "Tìm kiếm sản phẩm dựa trên câu hỏi của người dùng. Yêu cầu đăng nhập.",
            inputSchema: {
              type: "object",
              properties: {
                question: {
                  type: "string",
                  description: "Câu hỏi của người dùng về sản phẩm",
                },
              },
              required: ["question"],
            },
          },
          {
            name: "create_order",
            description:
              "Tạo đơn hàng dựa trên yêu cầu của người dùng. Yêu cầu đăng nhập.",
            inputSchema: {
              type: "object",
              properties: {
                accessToken: {
                  type: "string",
                  description: "Access token của người dùng đã đăng nhập",
                },
                question: {
                  type: "string",
                  description: "Yêu cầu mua sản phẩm",
                },
                name: {
                  type: "string",
                  description: "Tên người mua",
                },
                phone: {
                  type: "string",
                  description: "Số điện thoại",
                },
                address: {
                  type: "string",
                  description: "Địa chỉ giao hàng",
                },
              },
              required: ["question"],
            },
          },
        ],
      };
    });
  }

  private registerCallHandler(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_products":
            return await this.handleSearchProducts(args);

          case "create_order":
            return await this.handleCreateOrder(args);

          default:
            return this.createErrorResponse(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return this.createErrorResponse(
          error.message || "Tool execution failed"
        );
      }
    });
  }

  private async handleSearchProducts(args: any) {
    const { question } = args as { question: string };

    const analysis = await this.analyzeProductQuery(question);

    if (!analysis.isProductQuery) {
      return this.createSuccessResponse({
        message: "Câu hỏi này không có vẻ như đang tìm kiếm sản phẩm.",
        intent: analysis.intent,
      });
    }

    const allProducts = await this.services.productService.getProducts();
    if (allProducts.length === 0) {
      return this.createSuccessResponse({
        message: "Không tìm thấy sản phẩm nào trong cơ sở dữ liệu.",
        products: [],
      });
    }

    const matchedProducts = await this.matchProductsByKeywords(
      analysis.keywords,
      allProducts
    );

    return this.createSuccessResponse({
      message: `Tìm thấy ${matchedProducts.length} sản phẩm phù hợp.`,
      intent: analysis.intent,
      keywords: analysis.keywords,
      products: matchedProducts,
    });
  }

  private async handleCreateOrder(args: any) {
    const { accessToken, question, name, phone, address } = args as {
      accessToken?: string;
      question: string;
      name?: string;
      phone?: string;
      address?: string;
    };

    const userId = accessToken ? this.verifyAccessToken(accessToken) : null;

    const allProducts = await this.services.productService.getProducts();
    if (allProducts.length === 0) {
      return this.createErrorResponse("Không tìm thấy sản phẩm nào.");
    }

    const extraction = await this.extractOrderItems(question, allProducts);

    if (!extraction.isBuyIntent || extraction.items.length === 0) {
      return this.createSuccessResponse({
        message: "Yêu cầu không có vẻ như đang muốn mua sản phẩm.",
        availableProducts: allProducts.slice(0, 5),
      });
    }

    if (!userId && (!name || !phone || !address)) {
      const missingFields = [];
      if (!name) missingFields.push("name");
      if (!phone) missingFields.push("phone");
      if (!address) missingFields.push("address");

      return this.createSuccessResponse({
        message:
          "🔐 Bạn chưa đăng nhập. Để tạo đơn hàng, bạn có 2 lựa chọn:\n" +
          "1️⃣ Đăng nhập vào tài khoản của bạn\n" +
          "2️⃣ Cung cấp thông tin sau để tạo đơn hàng nhanh",
        requiredFields: missingFields,
        items: extraction.items,
        nextStep: "provide_info",
        example: {
          name: "Đình Phúc",
          phone: "0339592404",
          address: "Huế",
        },
      });
    }

    const validatedItems = await this.validateOrderItems(extraction.items);

    const order = await this.services.orderService.createOrder(
      userId,
      validatedItems,
      userId
        ? undefined
        : {
            name: name as string,
            phone: phone as string,
            address: address as string,
          }
    );

    console.log("Created order:", order);

    return this.createSuccessResponse({
      message: "✅ Đơn hàng đã được tạo thành công!",
      data: order,
    });
  }
}
