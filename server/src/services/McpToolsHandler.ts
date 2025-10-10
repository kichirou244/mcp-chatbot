import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createServices } from "./index.js";
import { AiAgentFactory } from "../aiAgents/aiAgentFactory";
import { IProduct } from "../models/Product.js";
import { JwtUtility } from "../utils/jwtUtility";

export class McpToolsHandler {
  constructor(
    private server: Server,
    private services: ReturnType<typeof createServices>
  ) {}

  registerAll(): void {
    this.registerListToolsHandler();
    this.registerCallToolHandler();
  }

  private registerListToolsHandler(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_products",
            description:
              "Tìm kiếm sản phẩm trong cửa hàng dựa trên từ khóa hoặc tiêu chí",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Câu hỏi hoặc từ khóa tìm kiếm sản phẩm",
                },
                conversationContext: {
                  type: "string",
                  description: "Ngữ cảnh hội thoại trước đó (nếu có)",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "create_order",
            description:
              "Tạo đơn hàng cho khách. Yêu cầu thông tin sản phẩm và thông tin khách hàng",
            inputSchema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "Yêu cầu đặt hàng của khách",
                },
                conversationContext: {
                  type: "string",
                  description:
                    "Ngữ cảnh hội thoại để xác định sản phẩm và thông tin khách",
                },
                accessToken: {
                  type: "string",
                  description: "Access token của user đã đăng nhập (optional)",
                },
              },
              required: ["message"],
            },
          },
          {
            name: "analyze_intent",
            description:
              "Phân tích ý định của người dùng để quyết định tool phù hợp",
            inputSchema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "Câu hỏi của người dùng",
                },
                conversationContext: {
                  type: "string",
                  description: "Lịch sử hội thoại",
                },
              },
              required: ["message"],
            },
          },
          {
            name: "generate_final_response",
            description:
              "Tạo câu trả lời cuối cùng dựa trên kết quả của tool đã thực hiện",
            inputSchema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "Câu hỏi gốc của người dùng",
                },
                conversationContext: {
                  type: "string",
                  description: "Ngữ cảnh hội thoại",
                },
                tool: {
                  type: "string",
                  description: "Tool đã được sử dụng",
                },
                toolResult: {
                  type: "object",
                  description: "Kết quả từ tool",
                },
              },
              required: ["message", "tool", "toolResult"],
            },
          },
        ],
      };
    });
  }

  private registerCallToolHandler(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      console.log(`[MCP Tool Call] ${name}`, args);

      try {
        switch (name) {
          case "analyze_intent":
            return await this.handleAnalyzeIntent(args);

          case "search_products":
            return await this.handleSearchProducts(args);

          case "create_order":
            return await this.handleCreateOrder(args);

          case "generate_final_response":
            return await this.handleGenerateFinalResponse(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        console.error(`[MCP Tool Error] ${name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                tool: name,
              }),
            },
          ],
        };
      }
    });
  }

  private async handleAnalyzeIntent(args: any) {
    const { message, conversationContext = "" } = args;
    const agent = AiAgentFactory.create("gemini");

    const prompt = `Bạn là trợ lý thông minh cho cửa hàng thương mại điện tử. 
Phân tích câu hỏi của người dùng dựa trên TOÀN BỘ NGỮ CẢNH hội thoại và quyết định tool phù hợp nhất.
${conversationContext}

TOOLS có sẵn:
1. search_products: Tìm kiếm sản phẩm (khi user hỏi về sản phẩm, muốn xem, tìm kiếm)
   - VD: "Có laptop nào không?", "Cho tôi xem điện thoại", "Cái nào rẻ nhất?" (khi đang nói về sản phẩm)

2. create_order: Tạo đơn hàng (khi user muốn mua, đặt hàng)
   - VD: "Tôi muốn mua cái này", "Đặt hàng laptop đó", "Mua 2 cái"
  
3. none: Không cần tool (chat thông thường, chào hỏi, hỏi thông tin cửa hàng)
   - VD: "Xin chào", "Cảm ơn", "Shop mở cửa mấy giờ?"

LƯU Ý QUAN TRỌNG:
- Nếu user dùng đại từ như "cái này", "cái đó", "nó", hãy xem lịch sử để hiểu họ đang nói về gì
- Nếu user hỏi "cái nào rẻ nhất?" và trước đó đang nói về laptop, thì vẫn là search_products cho laptop
- Nếu user nói "mua cái này" và trước đó đã tìm sản phẩm, thì là create_order

Chỉ trả về JSON với format sau (không thêm markdown):
{
  "tool": "tên_tool_hoặc_none",
  "confidence": 0.95,
  "params": { 
    "question": "câu hỏi đầy đủ có context",
    "referenceContext": "thông tin từ lịch sử nếu cần"
  },
  "reasoning": "lý do chọn tool này dựa trên context"
}

Câu hỏi hiện tại của người dùng: "${message}"`;

    const response = await agent.ask("gemini-2.5-flash", prompt);
    const analysis = this.parseAIResponse(response);

    console.log("[Analyze Intent] Response:", analysis);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            tool: "analyze_intent",
            data: analysis,
          }),
        },
      ],
    };
  }

  private async handleSearchProducts(args: any) {
    const { query, conversationContext = "" } = args;
    const agent = AiAgentFactory.create("gemini");

    const allProducts = await this.services.productService.getProducts();

    if (allProducts.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "search_products",
              data: [],
              message: "Không tìm thấy sản phẩm nào trong cơ sở dữ liệu.",
            }),
          },
        ],
      };
    }

    const matchPrompt = `Dựa vào câu hỏi và ngữ cảnh hội thoại, tìm sản phẩm phù hợp nhất.
${conversationContext}

Câu hỏi hiện tại: "${query}"

Danh sách sản phẩm:
${JSON.stringify(
  allProducts.map((p: IProduct) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
  }))
)}

Tìm các sản phẩm phù hợp và trả về JSON:
{
  "matchedProducts": [id1, id2, ...],
  "keywords": ["từ khóa tìm được"],
  "reason": "lý do match"
}

Nếu không tìm thấy sản phẩm phù hợp, trả về matchedProducts = []`;

    const matchResponse = await agent.ask("gemini-2.5-flash", matchPrompt);
    const matchResult = this.parseAIResponse(matchResponse);

    const matchedProducts = allProducts.filter((p: IProduct) =>
      matchResult.matchedProducts.includes(p.id)
    );

    console.log("[Search] Match Result:", matchResult);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            tool: "search_products",
            data: matchedProducts,
            keywords: matchResult.keywords,
            message: `Tìm thấy ${matchedProducts.length} sản phẩm phù hợp`,
            reason: matchResult.reason,
          }),
        },
      ],
    };
  }

  private async handleCreateOrder(args: any) {
    const { message, conversationContext = "", accessToken } = args;
    const agent = AiAgentFactory.create("gemini");

    try {
      const allProducts = await this.services.productService.getProducts();

      if (allProducts.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                tool: "create_order",
                error: "Không tìm thấy sản phẩm nào để đặt hàng",
              }),
            },
          ],
        };
      }

      const extractPrompt = `Phân tích yêu cầu của người dùng dựa trên ngữ cảnh hội thoại.
${conversationContext}

YÊU CẦU HIỆN TẠI: "${message}"

Sản phẩm có sẵn:
${JSON.stringify(
  allProducts.map((p: IProduct) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    quantity: p.quantity,
  }))
)}

NHIỆM VỤ:
1. Xác định đây có phải yêu cầu đặt hàng không? (isBuyIntent)
   - Có từ khóa: "mua", "đặt hàng", "order", "lấy", "muốn", "cho tôi"...
   - Ngữ cảnh đang nói về việc mua sản phẩm

2. Nếu là yêu cầu đặt hàng, extract:
   - id, name, quantity của sản phẩm (từ allProducts + message)
   - Nếu user dùng đại từ "cái này", "nó", "cái đó" → xem lịch sử để xác định
   - Số lượng mặc định là 1 nếu không nói rõ

3. Extract thông tin khách hàng (nếu có):
   - name: tên khách hàng
   - phone: số điện thoại
   - address: địa chỉ giao hàng

Trả về JSON theo format:
{
  "isBuyIntent": true/false,
  "items": [{"id": 1, "name": "Tên sản phẩm", "quantity": 2}],
  "guestInfo": {
    "name": "...",
    "phone": "...",
    "address": "..."
  },
  "reasoning": "lý do xác định"
}

Chú ý: Chỉ điền guestInfo nếu user cung cấp rõ ràng trong message`;

      const extractResponse = await agent.ask(
        "gemini-2.5-flash",
        extractPrompt
      );

      console.log("[Extract Response]", extractResponse);

      const extraction = this.parseAIResponse(extractResponse);

      if (!extraction.isBuyIntent) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                tool: "create_order",
                isBuyIntent: false,
                message: "Đây không phải là yêu cầu đặt hàng.",
                reasoning: extraction.reasoning,
              }),
            },
          ],
        };
      }

      if (!extraction.items || extraction.items.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                tool: "create_order",
                isBuyIntent: true,
                message: "Yêu cầu không rõ ràng về sản phẩm cần mua.",
                suggestion: "Vui lòng nói rõ sản phẩm bạn muốn mua",
                availableProducts: allProducts.slice(0, 5),
                reasoning: extraction.reasoning,
              }),
            },
          ],
        };
      }

      const validatedItems = [];
      for (const item of extraction.items) {
        const product = await this.services.productService.getProductById(
          item.id
        );

        if (!product) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  tool: "create_order",
                  isBuyIntent: true,
                  error: `Sản phẩm "${item.name}" (ID: ${item.id}) không tồn tại.`,
                }),
              },
            ],
          };
        }

        if (product.quantity < item.quantity) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  tool: "create_order",
                  isBuyIntent: true,
                  error: `Sản phẩm "${product.name}" không đủ số lượng. Còn lại: ${product.quantity}, yêu cầu: ${item.quantity}`,
                }),
              },
            ],
          };
        }

        validatedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
        });
      }

      let userId = null;

      if (accessToken) {
        try {
          const decoded = JwtUtility.verifyToken(accessToken);
          userId = decoded.id;

          const orderResult = await this.services.orderService.createOrder(
            userId,
            validatedItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            undefined
          );

          const totalAmount = validatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  tool: "create_order",
                  isBuyIntent: true,
                  order: orderResult,
                  message:
                    "Đơn hàng đã được tạo thành công!\n" +
                    "Thông tin đơn hàng:\n" +
                    validatedItems
                      .map(
                        (item, idx) =>
                          `${idx + 1}. ${item.productName} x${
                            item.quantity
                          } - ${item.price.toLocaleString()}đ`
                      )
                      .join("\n") +
                    `\nTổng cộng: ${totalAmount.toLocaleString()}đ`,
                  items: validatedItems,
                  totalAmount,
                }),
              },
            ],
          };
        } catch (error: any) {
          console.error("[Token Error]", error);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: false,
                  tool: "create_order",
                  error: "Token không hợp lệ hoặc đã hết hạn.",
                }),
              },
            ],
          };
        }
      }

      const guestInfo = extraction.guestInfo;

      if (
        !guestInfo ||
        !guestInfo.name ||
        !guestInfo.phone ||
        !guestInfo.address
      ) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                tool: "create_order",
                isBuyIntent: true,
                requireGuestInfo: true,
                message:
                  "Bạn chưa đăng nhập. Để tạo đơn hàng, vui lòng cung cấp:\n" +
                  "• Tên của bạn\n" +
                  "• Số điện thoại\n" +
                  "• Địa chỉ giao hàng\n\n" +
                  "Ví dụ: Tên tôi là Phúc, số điện thoại 0339592404, địa chỉ Huế",
                requiredFields: {
                  name: guestInfo?.name || null,
                  phone: guestInfo?.phone || null,
                  address: guestInfo?.address || null,
                },
                items: validatedItems,
              }),
            },
          ],
        };
      }

      const orderResult = await this.services.orderService.createOrder(
        null,
        validatedItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        {
          name: guestInfo.name,
          phone: guestInfo.phone,
          address: guestInfo.address,
        }
      );

      console.log("[Order] Creation Result:", orderResult);

      const totalAmount = validatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              tool: "create_order",
              isBuyIntent: true,
              order: orderResult,
              message:
                "Đơn hàng đã được tạo thành công!\n" +
                "Thông tin đơn hàng:\n" +
                validatedItems
                  .map(
                    (item, idx) =>
                      `${idx + 1}. ${item.productName} x${
                        item.quantity
                      } - ${item.price.toLocaleString()}đ`
                  )
                  .join("\n") +
                `\nTổng cộng: ${totalAmount.toLocaleString()}đ`,
              guestInfo: {
                name: guestInfo.name,
                phone: guestInfo.phone,
              },
              items: validatedItems,
              totalAmount,
            }),
          },
        ],
      };
    } catch (error: any) {
      console.error("[handleCreateOrder Error]", error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              tool: "create_order",
              error: error.message,
              message: "Lỗi khi tạo đơn hàng",
            }),
          },
        ],
      };
    }
  }

  private parseAIResponse(response: string): any {
    const cleaned = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned);
  }

  private async handleGenerateFinalResponse(args: any) {
    const { message, conversationContext = "", tool, toolResult } = args;

    const response = await this.generateFinalResponse(
      message,
      conversationContext,
      tool,
      toolResult
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            tool: "generate_final_response",
            response: response,
          }),
        },
      ],
    };
  }

  async generateFinalResponse(
    message: string,
    conversationContext: string,
    tool: string,
    toolResult: any
  ): Promise<string> {
    const agent = AiAgentFactory.create("gemini");

    let orderSummary = "";
    if (
      tool === "create_order" &&
      toolResult &&
      toolResult.success &&
      toolResult.order &&
      Array.isArray(toolResult.items) &&
      toolResult.items.length > 0
    ) {
      orderSummary =
        "\n\nThông tin đơn hàng:\n" +
        toolResult.items
          .map(
            (item: any, idx: number) =>
              `${idx + 1}. ${item.productName} - số lượng: ${item.quantity}`
          )
          .join("\n") +
        (toolResult.totalAmount
          ? `\nTổng tiền: ${toolResult.totalAmount.toLocaleString()}đ`
          : "");
    }

    const prompt = `Bạn là trợ lý cửa hàng thân thiện và thông minh.
${conversationContext}

Dựa vào LỊCH SỬ HỘI THOẠI và kết quả tool, hãy tạo câu trả lời tự nhiên, mạch lạc.

Câu hỏi hiện tại: "${message}"
Tool đã dùng: ${tool}
Kết quả tool: ${JSON.stringify(toolResult)}
Danh sách sản phẩm đơn hàng:${orderSummary}

HƯỚNG DẪN:
- Nếu user dùng đại từ ("cái này", "nó", "cái đó"), hãy nhắc lại tên sản phẩm cụ thể
- Trả lời ngắn gọn, súc tích nhưng đầy đủ thông tin
- Nếu có danh sách sản phẩm, liệt kê rõ ràng với giá (tối đa 5 sản phẩm)
- Nếu user hỏi tiếp về sản phẩm đã nói trước đó, hãy tiếp tục ngữ cảnh đó
- Luôn thân thiện và hữu ích
- Nếu có lỗi, giải thích rõ ràng và gợi ý hướng giải quyết
- Nếu có danh sách sản phẩm đơn hàng vừa tạo, hãy tóm tắt đơn hàng, liệt kê các sản phẩm và tổng lượng mua của sản phẩm đó. Cuối cùng đó là tổng số tiền của đơn hàng

Trả lời:`;

    return await agent.ask("gemini-2.5-flash", prompt);
  }
}
