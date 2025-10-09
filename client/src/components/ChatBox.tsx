import { useState, useRef, useEffect } from "react";
import { chatWithAi } from "../actions/aiAgent.actions";
import type { ChatMessage, ProgressEvent } from "../actions/aiAgent.actions";

interface Message {
  id: string;
  type: "user" | "bot" | "system" | "progress";
  content: string;
  timestamp: Date;
  tool?: string;
  data?: any;
}

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatBox({ isOpen, onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "system",
      content:
        "👋 Xin chào! Bạn có thể hỏi về sản phẩm hoặc đặt hàng.",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildChatHistory = (): ChatMessage[] => {
    return messages
      .filter((msg) => msg.type === "user" || msg.type === "bot")
      .slice(-10)
      .map((msg) => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.content,
      }));
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

    const progressMessageId = `progress-${Date.now()}`;
    const progressMessage: Message = {
      id: progressMessageId,
      type: "progress",
      content: "Đang xử lý...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, progressMessage]);

    try {
      const chatHistory = buildChatHistory();

      const response = await chatWithAi(
        currentInput,
        chatHistory,
        (progress: ProgressEvent) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === progressMessageId
                ? { ...msg, content: progress.message }
                : msg
            )
          );
        }
      );

      setMessages((prev) => prev.filter((msg) => msg.id !== progressMessageId));

      if (response.success) {
        if (response.tool && response.tool !== "none") {
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            type: "system",
            content: `Đã sử dụng: ${response.tool}`,
            timestamp: new Date(),
            tool: response.tool,
          };
          setMessages((prev) => [...prev, systemMessage]);
        }

        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          type: "bot",
          content: response.response,
          timestamp: new Date(),
          tool: response.tool,
          data: response.toolResult,
        };
        setMessages((prev) => [...prev, botMessage]);

        if (response.tool === "create_order") {
          window.dispatchEvent(new CustomEvent("products-updated"));
        }
      } else {
        throw new Error(response.message || "Đã xảy ra lỗi");
      }
    } catch (error: any) {
      setMessages((prev) => prev.filter((msg) => msg.id !== progressMessageId));

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-semibold">Chat bot</h3>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.type === "user"
                  ? "bg-blue-500 text-white"
                  : msg.type === "system"
                  ? "bg-yellow-100 text-gray-800 text-sm"
                  : msg.type === "progress"
                  ? "bg-purple-100 text-purple-800 text-sm italic animate-pulse"
                  : "bg-white text-gray-800 shadow"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {msg.tool === "search_products" && msg.data?.data && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold mb-2">
                    Sản phẩm tìm thấy:
                  </p>
                  {msg.data.data.slice(0, 3).map((product: any) => (
                    <div
                      key={product.id}
                      className="text-xs bg-gray-50 p-2 rounded mb-1"
                    >
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-blue-600">
                        {product.price?.toLocaleString()} VNĐ
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-3 shadow">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
