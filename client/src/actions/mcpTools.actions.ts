import { mcpClient } from "@/client";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProgressEvent {
  step: string;
  message: string;
  data?: any;
}

export async function chatWithMcpTools(
  message: string,
  chatHistory: ChatMessage[] = [],
  onProgress?: (progress: ProgressEvent) => void
) {
  try {
    onProgress?.({
      step: "connecting",
      message: "Đang kết nối tới MCP Server...",
    });

    await mcpClient.ensureConnected();
    console.log("[MCP Client] Connected");

    const conversationContext = buildConversationContext(chatHistory);

    onProgress?.({
      step: "analyzing",
      message: "Đang phân tích...",
    });

    const analysisResult = await mcpClient.callTool("analyze_intent", {
      message,
      conversationContext,
    });

    const analysis = JSON.parse((analysisResult as any).content[0].text);

    onProgress?.({
      step: "analyzed",
      message: `Tool: ${getToolName(analysis.data.tool)}`,
      data: analysis.data,
    });

    let toolResult: any = null;
    const toolName = analysis.data.tool;

    switch (toolName) {
      case "search_products":
        onProgress?.({ step: "executing", message: "Đang tìm kiếm..." });

        const searchResult = await mcpClient.callTool("search_products", {
          query: message,
          conversationContext,
        });

        toolResult = JSON.parse((searchResult as any).content[0].text);
        onProgress?.({
          step: "tool_result",
          message: `Tìm thấy ${toolResult.data?.length || 0} sản phẩm`,
        });
        break;

      case "search_outlets":
        onProgress?.({ step: "executing", message: "Đang tìm kiếm..." });

        const outletResult = await mcpClient.callTool("search_outlets", {
          query: message,
          conversationContext,
        });

        toolResult = JSON.parse((outletResult as any).content[0].text);
        onProgress?.({
          step: "tool_result",
          message: `Tìm thấy ${toolResult.data?.length || 0} cửa hàng`,
        });
        break;

      case "search_products_and_outlets":
        onProgress?.({ step: "executing", message: "Đang tìm kiếm..." });

        const productsOutletsResult = await mcpClient.callTool(
          "search_products_and_outlets",
          {
            query: message,
            conversationContext,
          }
        );

        toolResult = JSON.parse((productsOutletsResult as any).content[0].text);
        onProgress?.({
          step: "tool_result",
          message: `Tìm thấy ${toolResult.products?.length || 0} sản phẩm và ${
            toolResult.outlets?.length || 0
          } cửa hàng`,
        });
        break;

      case "create_order":
        onProgress?.({ step: "executing", message: "Đang xử lý đơn hàng..." });

        const accessToken = localStorage.getItem("accessToken");
        const orderResult = await mcpClient.callTool("create_order", {
          message,
          conversationContext,
          accessToken,
        });

        toolResult = JSON.parse((orderResult as any).content[0].text);
        break;

      case "none":
        toolResult = {
          success: true,
          tool: "none",
          message: "Chat bình thường",
        };
        break;

      default:
        toolResult = { success: false, error: `Unknown tool: ${toolName}` };
    }

    onProgress?.({
      step: "generating",
      message: "Đang tạo phản hồi...",
    });

    const finalResponseResult = await mcpClient.callTool(
      "generate_final_response",
      { message, conversationContext, tool: toolName, toolResult }
    );

    const finalResponse = JSON.parse(
      (finalResponseResult as any).content[0].text
    );

    onProgress?.({
      step: "complete",
      message: "Hoàn tất",
    });

    return {
      success: true,
      response: finalResponse.response,
      tool: toolName,
      toolResult,
      analysis: analysis.data,
    };
  } catch (error: any) {
    console.error("[chatWithMcpTools Error]", error);
    throw error;
  }
}

export async function listAvailableTools() {
  try {
    await mcpClient.ensureConnected();
    const { tools } = await mcpClient.listTools();
    return tools;
  } catch (error) {
    console.error("[listAvailableTools Error]", error);
    throw error;
  }
}

export async function listAvailableResources() {
  try {
    await mcpClient.ensureConnected();
    const { resources } = await mcpClient.listResources();
    return resources;
  } catch (error) {
    console.error("[listAvailableResources Error]", error);
    throw error;
  }
}

function buildConversationContext(chatHistory: ChatMessage[]): string {
  if (chatHistory.length === 0) return "";
  return (
    "\n\nLịch sử hội thoại:\n" +
    chatHistory
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n")
  );
}

function getToolName(tool: string): string {
  const names: Record<string, string> = {
    search_outlets: "Tìm kiếm cửa hàng",
    search_products_and_outlets: "Tìm kiếm sản phẩm và cửa hàng",
    search_products: "Tìm kiếm sản phẩm",
    create_order: "Tạo đơn hàng",
    analyze_intent: "Phân tích",
    none: "Trò chuyện",
  };
  return names[tool] || tool;
}
