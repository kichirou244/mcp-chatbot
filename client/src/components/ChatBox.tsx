import { useState, useRef, useEffect } from "react";
import { mcpClient } from "../client";
import { askAi } from "../actions/aiAgent.action";

interface Message {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  tool?: string;
  data?: any;
}

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PendingOrder {
  question: string;
  waitingForInfo: boolean;
}

export function ChatBox({ isOpen, onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content: "👋 Xin chào! Bạn có thể hỏi về sản phẩm hoặc đặt hàng ngay.",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userToken] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function safeParseJSON(str: string): any {
    const cleaned = str.replace(/```json\s*|```/g, "");
    try {
      return JSON.parse(cleaned);
    } catch {
      return { error: str };
    }
  }

  const detectIntent = async (
    message: string
  ): Promise<{ tool: string; confidence: string; params: any }> => {
    const prompt = `Bạn là một trợ lý ảo cho cửa hàng thương mại điện tử. Dựa trên tin nhắn của người dùng, hãy xác định ý định của họ và chọn công cụ phù hợp nhất từ danh sách sau:

1. search_products: Khi người dùng muốn TÌM KIẾM, XEM, HỎI về sản phẩm

2. create_order: Khi người dùng muốn MUA, ĐẶT HÀNG, ĐẶT sản phẩm

3. none: Không sử dụng công cụ nào

Chỉ trả về một đối tượng JSON hợp lệ, không có ký tự thừa.
Đầu ra phải chỉ bao gồm JSON với các trường: tool, confidence, params.

Ví dụ:
{"tool": "search_products", "confidence": "0.95", "params": {"question": "Tôi muốn tìm điện thoại thông minh."}}
{"tool": "create_order", "confidence": "0.98", "params": {"question": "Tôi muốn mua 2 cái laptop"}}

Tin nhắn: "${message}"`;

    const response = await askAi("gemini-2.0-flash-exp", "gemini", prompt);

    return safeParseJSON(response.response);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      if (pendingOrder) {
        await handlePendingOrderInput(currentInput);
        return;
      }

      const intent = await detectIntent(currentInput);

      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        type: "system",
        content: `🤖 Đang sử dụng tool: ${intent.tool}...`,
        timestamp: new Date(),
        tool: intent.tool,
      };
      setMessages((prev) => [...prev, systemMessage]);

      let response: any;

      switch (intent.tool) {
        case "search_products":
          response = await mcpClient.searchProducts(intent.params.question);
          break;

        case "create_order":
          response = await mcpClient.createOrder({
            question: intent.params.question,
            accessToken: userToken || undefined,
          });

          if (response.success && (response as any).data?.requiredFields) {
            setPendingOrder({
              question: intent.params.question,
              waitingForInfo: true,
            });
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}`,
                type: "bot",
                content:
                  (response as any).data.message +
                  "\n\n� Bạn có thể:\n" +
                  "1️⃣ Đăng nhập bằng cách nhập: 'đăng nhập username password'\n" +
                  "2️⃣ Hoặc cung cấp thông tin theo mẫu:\n" +
                  "   Tên: Đình Phúc\n" +
                  "   SĐT: 0339592404\n" +
                  "   Địa chỉ: Huế",
                timestamp: new Date(),
                tool: "create_order",
                data: (response as any).data,
              },
            ]);
            setIsLoading(false);
            return;
          }

          break;

        default:
          response = { success: false, error: "Tool không được hỗ trợ" };
      }

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: formatResponse(response, intent.tool),
        timestamp: new Date(),
        tool: intent.tool,
        data: response,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "bot",
        content: `❌ Lỗi: ${error.message || "Đã xảy ra lỗi"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePendingOrderInput = async (input: string) => {
    if (!pendingOrder) return;

    try {
      const loginPattern = /đăng nhập|login/i;
      if (loginPattern.test(input)) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: "bot",
            content:
              "ℹ️ Tính năng đăng nhập đang được phát triển.\n\n" +
              "Vui lòng cung cấp thông tin theo mẫu:\n" +
              "Tên: Đình Phúc\n" +
              "SĐT: 0339592404\n" +
              "Địa chỉ: Huế",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const extractPrompt = `Trích xuất thông tin khách hàng từ văn bản sau:
"${input}"

Tìm các thông tin:
- name (tên): Tên người đặt hàng
- phone (số điện thoại): Số điện thoại liên hệ
- address (địa chỉ): Địa chỉ giao hàng

Trả về JSON với format:
{
  "name": "tên hoặc null",
  "phone": "số điện thoại hoặc null",
  "address": "địa chỉ hoặc null"
}

Chỉ trả về JSON, không giải thích.`;

      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        type: "system",
        content: `🤖 Đang xử lý thông tin...`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);

      const extractResponse = await askAi(
        "gemini-2.0-flash-exp",
        "gemini",
        extractPrompt
      );

      const extractedData = safeParseJSON(extractResponse.response);

      if (
        !extractedData.name ||
        !extractedData.phone ||
        !extractedData.address
      ) {
        const missingFields: string[] = [];
        if (!extractedData.name) missingFields.push("Tên");
        if (!extractedData.phone) missingFields.push("Số điện thoại");
        if (!extractedData.address) missingFields.push("Địa chỉ");

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            type: "bot",
            content:
              `⚠️ Thiếu thông tin: ${missingFields.join(", ")}\n\n` +
              "Vui lòng cung cấp đầy đủ thông tin theo mẫu:\n" +
              "Tên: Đình Phúc\n" +
              "SĐT: 0339592404\n" +
              "Địa chỉ: Huế",
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const createSystemMessage: Message = {
        id: `system-${Date.now()}`,
        type: "system",
        content:
          `🤖 Đang tạo đơn hàng với thông tin:\n` +
          `👤 Tên: ${extractedData.name}\n` +
          `📞 SĐT: ${extractedData.phone}\n` +
          `📍 Địa chỉ: ${extractedData.address}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, createSystemMessage]);

      const response = await mcpClient.createOrder({
        question: pendingOrder.question,
        name: extractedData.name,
        phone: extractedData.phone,
        address: extractedData.address,
        accessToken: userToken || undefined,
      });

      setPendingOrder(null);

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: formatResponse(response, "create_order"),
        timestamp: new Date(),
        tool: "create_order",
        data: response,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "bot",
        content: `❌ Lỗi: ${error.message || "Đã xảy ra lỗi"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setPendingOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatResponse = (response: any, tool: string): string => {
    if (!response.success) return `❌ ${response.error || "Đã xảy ra lỗi"}`;

    const data = response.data ?? response;

    switch (tool) {
      case "search_products":
        if (data.products && data.products.length > 0) {
          return `${data.message}\n\n📦 Sản phẩm tìm thấy:\n${data.products
            .map(
              (p: any, idx: number) =>
                `${idx + 1}. ${p.name}\n   💵 Giá: $${
                  p.price
                }\n   📊 Còn lại: ${p.quantity} sản phẩm`
            )
            .join("\n\n")}`;
        }
        return `ℹ️ ${data.message || "Không tìm thấy sản phẩm phù hợp"}`;

      case "create_order":
        if (data.order) {
          const order = data.order;
          return (
            `${data.message}\n\n📋 Thông tin đơn hàng:\n` +
            `🆔 Mã đơn: #${order.id}\n` +
            `💰 Tổng tiền: $${order.totalPrice}\n` +
            `📦 Số sản phẩm: ${order.orderDetails?.length || 0} loại\n` +
            `📅 Ngày tạo: ${new Date(order.createdAt).toLocaleString(
              "vi-VN"
            )}\n\n` +
            `Cảm ơn bạn đã đặt hàng! 🎉`
          );
        }
        return `ℹ️ ${data.message}`;

      default:
        return JSON.stringify(data, null, 2);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <h3 className="font-semibold">Chat Bot</h3>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-blue-700 rounded-full p-1 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === "user"
                  ? "bg-blue-600 text-white"
                  : message.type === "system"
                  ? "bg-gray-100 text-gray-600 text-sm italic"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            disabled={isLoading}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
