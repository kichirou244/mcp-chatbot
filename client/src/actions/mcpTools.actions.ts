import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

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
  let client: Client | null = null;

  try {
    onProgress?.({
      step: "connecting",
      message: "Đang kết nối tới MCP Server...",
    });

    const transport = new SSEClientTransport(new URL(`${BASE_URL}/connect`));

    client = new Client(
      {
        name: "mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    console.log("[MCP Client] Connected");

    const { tools } = await client.listTools();
    console.log(
      "[Available Tools]",
      tools.map((t) => t.name)
    );

    const conversationContext = buildConversationContext(chatHistory);

    onProgress?.({
      step: "analyzing",
      message: "Đang phân tích...",
    });

    const analysisResult = await client.callTool({
      name: "analyze_intent",
      arguments: { message, conversationContext },
    });

    const analysis = JSON.parse((analysisResult as any).content[0].text);
    console.log("[Analysis]", analysis);

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

        const searchResult = await client.callTool({
          name: "search_products",
          arguments: { query: message, conversationContext },
        });

        toolResult = JSON.parse((searchResult as any).content[0].text);
        onProgress?.({
          step: "tool_result",
          message: `Tìm thấy ${toolResult.data?.length || 0} sản phẩm`,
        });
        break;

      case "create_order":
        onProgress?.({ step: "executing", message: "Đang xử lý đơn hàng..." });

        const accessToken = localStorage.getItem("accessToken");
        const orderResult = await client.callTool({
          name: "create_order",
          arguments: { message, conversationContext, accessToken },
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

    console.log("[Tool Result]", toolResult);

    onProgress?.({
      step: "generating",
      message: "Đang tạo phản hồi...",
    });

    const finalResponseResult = await client.callTool({
      name: "generate_final_response",
      arguments: { message, conversationContext, tool: toolName, toolResult },
    });

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
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (e) {
        console.error("Error closing client:", e);
      }
    }
  }
}

export async function listAvailableTools() {
  let client: Client | null = null;
  try {
    const transport = new SSEClientTransport(new URL(`${BASE_URL}/connect`));
    client = new Client(
      { name: "tools-lister", version: "1.0.0" },
      { capabilities: {} }
    );
    await client.connect(transport);
    const { tools } = await client.listTools();
    return tools;
  } finally {
    if (client) await client.close();
  }
}

export async function listAvailableResources() {
  let client: Client | null = null;
  try {
    const transport = new SSEClientTransport(new URL(`${BASE_URL}/connect`));
    client = new Client(
      { name: "resources-lister", version: "1.0.0" },
      { capabilities: {} }
    );
    await client.connect(transport);
    const { resources } = await client.listResources();
    return resources;
  } finally {
    if (client) await client.close();
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
    search_products: "Tìm kiếm sản phẩm",
    create_order: "Tạo đơn hàng",
    analyze_intent: "Phân tích",
    none: "Trò chuyện",
  };
  return names[tool] || tool;
}
