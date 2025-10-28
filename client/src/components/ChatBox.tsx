import { useState, useRef, useEffect } from "react";
import type { ChatMessage, ProgressEvent } from "../actions/mcpTools.actions";
import ReactMarkdown from "react-markdown";
import { chatWithMcpTools } from "../actions/mcpTools.actions";
import {
  createChatSession,
  addChatMessage,
  endSession,
} from "../actions/chatSession.actions";

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
      content: "👋 Xin chào! Bạn có thể hỏi về sản phẩm hoặc đặt hàng.",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateSessionId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${random}`;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !sessionId) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);

      const userId = localStorage.getItem("userId");
      createChatSession(newSessionId, userId ? parseInt(userId) : null)
        .then((result) => {
          if (result.ok && result.data) {
            console.log("[Session] Created:", result.data);
          }
        })
        .catch((error) => {
          console.error("[Session] Failed to create:", error);
        });
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (!isOpen && sessionId) {
      endSession(sessionId).catch(console.error);
      setSessionId(null);
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId) {
        const blob = new Blob(
          [JSON.stringify({ sessionId: sessionId })],
          { type: "application/json" }
        );
        navigator.sendBeacon(
          `${import.meta.env.VITE_BASE_URL}/chat-session/${sessionId}/end`,
          blob
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sessionId]);

  const buildChatHistory = (): ChatMessage[] => {
    return messages
      .filter((msg) => msg.type === "user" || msg.type === "bot")
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

    if (sessionId) {
      addChatMessage(sessionId, "user", currentInput).catch(console.error);
    }

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

      const response = await chatWithMcpTools(
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
        },
        sessionId
      );

      setMessages((prev) => prev.filter((msg) => msg.id !== progressMessageId));

      if (response.success) {
        if (sessionId) {
          addChatMessage(
            sessionId,
            "assistant",
            response.response,
            response.tool || null,
            response.tokensUsed || 0
          ).catch(console.error);
        }

        if (response.tool && response.tool !== "none") {
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            type: "system",
            content: `Đã sử dụng: ${response.tool} (${response.tokensUsed || 0} tokens)`,
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
        throw new Error("Đã xảy ra lỗi");
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
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
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
                  ? "bg-gray-200 text-gray-500 text-sm italic"
                  : msg.type === "progress"
                  ? "bg-purple-100 text-purple-500 text-sm italic"
                  : "bg-white text-gray-800 shadow"
              }`}
            >
              {msg.type === "bot" ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}

              <div className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
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
