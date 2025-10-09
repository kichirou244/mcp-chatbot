import { Request, Response } from "express";
import { AiAgentFactory } from "../aiAgents/aiAgentFactory";
import { createServices } from "../services/index.js";
import { IProduct } from "../models/Product.js";
import { JwtUtility } from "../utils/jwtUtility";

function sendSSE(res: Response, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getToolName(tool: string): string {
  const toolNames: Record<string, string> = {
    search_products: "Tìm kiếm sản phẩm",
    create_order: "Tạo đơn hàng",
    none: "Trò chuyện thông thường",
  };
  return toolNames[tool] || tool;
}

export const chat = async (req: Request, res: Response) => {
  try {
    const { message, chatHistory = [], stream = false } = req.body;
    const accessToken = req.headers.authorization
      ? req.headers.authorization.replace("Bearer ", "")
      : undefined;

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
    }

    const services = createServices();
    const agent = AiAgentFactory.create("gemini");

    console.log("[Chat Request]", {
      message,
      historyLength: chatHistory.length,
      hasToken: !!accessToken,
      streaming: stream,
    });

    const conversationContext = buildConversationContext(chatHistory);

    if (stream) {
      sendSSE(res, "progress", {
        step: "analyzing",
        message: "Đang phân tích câu hỏi của bạn...",
      });
    }

    const analysis = await analyzeIntent(agent, message, conversationContext);
    console.log("[AI Analysis]", analysis);

    if (stream) {
      sendSSE(res, "progress", {
        step: "analyzed",
        message: `Đã xác định: ${getToolName(analysis.tool)}`,
        data: { tool: analysis.tool, reasoning: analysis.reasoning },
      });
    }

    let toolResult: any = null;
    switch (analysis.tool) {
      case "search_products":
        if (stream) {
          sendSSE(res, "progress", {
            step: "executing",
            message: "Đang tìm kiếm sản phẩm phù hợp...",
          });
        }
        toolResult = await handleSearchProducts(
          agent,
          services,
          message,
          conversationContext
        );
        if (stream && toolResult.success) {
          sendSSE(res, "progress", {
            step: "tool_result",
            message: `Tìm thấy ${toolResult.data?.length || 0} sản phẩm`,
          });
        }
        break;

      case "create_order":
        if (stream) {
          sendSSE(res, "progress", {
            step: "executing",
            message: "Đang xử lý đơn hàng...",
          });
        }
        toolResult = await handleCreateOrder(
          agent,
          services,
          message,
          conversationContext,
          accessToken
        );
        if (stream && toolResult.success) {
          sendSSE(res, "progress", {
            step: "tool_result",
            message: "Đơn hàng đã được tạo thành công",
          });
        }
        break;

      case "none":
        toolResult = {
          success: true,
          tool: "none",
          message: "Chat thông thường, không cần tool",
        };
        break;

      default:
        toolResult = {
          success: false,
          error: `Unknown tool: ${analysis.tool}`,
        };
    }

    console.log("[Tool Result]", toolResult);

    if (stream) {
      sendSSE(res, "progress", {
        step: "generating",
        message: "Đang phản hồi...",
      });
    }

    const finalResponse = await generateFinalResponse(
      agent,
      message,
      conversationContext,
      analysis.tool,
      toolResult
    );

    const result = {
      success: true,
      response: finalResponse,
      tool: analysis.tool,
      toolResult: toolResult,
      analysis: analysis,
    };

    if (stream) {
      sendSSE(res, "complete", result);
      res.end();
    } else {
      res.status(200).json(result);
    }
  } catch (error: any) {
    console.error("[chatWithAi Error]", error);

    if (req.body.stream) {
      sendSSE(res, "error", {
        success: false,
        error: "Internal Server Error",
        message: error.message,
      });
      res.end();
    } else {
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
};

function buildConversationContext(chatHistory: any[]): string {
  if (chatHistory.length === 0) return "";

  return (
    "\n\nLịch sử hội thoại trước đó:\n" +
    chatHistory
      .map(
        (msg: any) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n")
  );
}

function parseAIResponse(response: string): any {
  const cleaned = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

async function analyzeIntent(
  agent: any,
  message: string,
  conversationContext: string
): Promise<any> {
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
  return parseAIResponse(response);
}

async function handleSearchProducts(
  agent: any,
  services: any,
  message: string,
  conversationContext: string
): Promise<any> {
  try {
    const allProducts = await services.productService.getProducts();

    if (allProducts.length === 0) {
      return {
        success: true,
        tool: "search_products",
        data: [],
        message: "Không tìm thấy sản phẩm nào trong cơ sở dữ liệu.",
      };
    }

    const matchPrompt = `Dựa vào câu hỏi và ngữ cảnh hội thoại, tìm sản phẩm phù hợp nhất.
${conversationContext}

Câu hỏi hiện tại: "${message}"

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
    const matchResult = parseAIResponse(matchResponse);

    const matchedProducts = allProducts.filter((p: IProduct) =>
      matchResult.matchedProducts.includes(p.id)
    );

    return {
      success: true,
      tool: "search_products",
      data: matchedProducts,
      keywords: matchResult.keywords,
      message: `Tìm thấy ${matchedProducts.length} sản phẩm phù hợp`,
      reason: matchResult.reason,
    };
  } catch (error: any) {
    console.error("[handleSearchProducts Error]", error);
    return {
      success: false,
      tool: "search_products",
      error: error.message,
      message: "Lỗi khi tìm kiếm sản phẩm",
    };
  }
}

async function handleCreateOrder(
  agent: any,
  services: any,
  message: string,
  conversationContext: string,
  accessToken?: string
): Promise<any> {
  try {
    const allProducts = await services.productService.getProducts();

    if (allProducts.length === 0) {
      return {
        success: false,
        tool: "create_order",
        error: "Không tìm thấy sản phẩm nào để đặt hàng",
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

    const extractResponse = await agent.ask("gemini-2.5-flash", extractPrompt);

    console.log("[Extract Response]", extractResponse);

    const extraction = parseAIResponse(extractResponse);

    if (!extraction.isBuyIntent) {
      return {
        success: false,
        tool: "create_order",
        isBuyIntent: false,
        message: "Đây không phải là yêu cầu đặt hàng.",
        reasoning: extraction.reasoning,
      };
    }

    if (!extraction.items || extraction.items.length === 0) {
      return {
        success: false,
        tool: "create_order",
        isBuyIntent: true,
        message: "Yêu cầu không rõ ràng về sản phẩm cần mua.",
        suggestion: "Vui lòng nói rõ sản phẩm bạn muốn mua",
        availableProducts: allProducts.slice(0, 5),
        reasoning: extraction.reasoning,
      };
    }

    const validatedItems = [];
    for (const item of extraction.items) {
      const product = await services.productService.getProductById(item.id);

      if (!product) {
        return {
          success: false,
          tool: "create_order",
          isBuyIntent: true,
          error: `Sản phẩm "${item.name}" (ID: ${item.id}) không tồn tại.`,
        };
      }

      if (product.quantity < item.quantity) {
        return {
          success: false,
          tool: "create_order",
          isBuyIntent: true,
          error: `Sản phẩm "${product.name}" không đủ số lượng. Còn lại: ${product.quantity}, yêu cầu: ${item.quantity}`,
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
        const userId = JwtUtility.decodeToken(accessToken);

        const orderResult = await services.orderService.createOrder(
          userId,
          validatedItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          null
        );

        const totalAmount = validatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          success: true,
          tool: "create_order",
          isBuyIntent: true,
          order: orderResult,
          message:
            "✅ Đơn hàng đã được tạo thành công!\n" +
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
        };
      } catch (error: any) {
        console.error("[Token Error]", error);
        return {
          success: false,
          tool: "create_order",
          error: "Token không hợp lệ hoặc đã hết hạn.",
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
        success: false,
        tool: "create_order",
        isBuyIntent: true,
        requireGuestInfo: true,
        message:
          "🔐 Bạn chưa đăng nhập. Để tạo đơn hàng, vui lòng cung cấp:\n" +
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
      };
    }

    const orderResult = await services.orderService.createOrder(
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

    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      success: true,
      tool: "create_order",
      isBuyIntent: true,
      order: orderResult,
      message:
        "✅ Đơn hàng đã được tạo thành công!\n" +
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
    };
  } catch (error: any) {
    console.error("[handleCreateOrder Error]", error);
    return {
      success: false,
      tool: "create_order",
      error: error.message,
      message: "Lỗi khi tạo đơn hàng",
    };
  }
}

async function generateFinalResponse(
  agent: any,
  message: string,
  conversationContext: string,
  tool: string,
  toolResult: any
): Promise<string> {
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
