import React, { useEffect, useState } from "react";
import { mcpClient } from "./client";
import { Products } from "./components/Products";
import { ChatBox } from "./components/ChatBox";

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const connectToServer = async () => {
      try {
        await mcpClient.connect("http://localhost:8080/connect");
        setIsConnected(true);
        setConnectionError(null);
      } catch (error: any) {
        console.error("Connection failed:", error);
        setConnectionError(error.message || "Không thể kết nối đến server");
      }
    };

    connectToServer();

    return () => {
      mcpClient.disconnect();
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          {connectionError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-600 text-lg">❌ {connectionError}</p>
              <p className="text-gray-600 mt-2">
                Vui lòng kiểm tra MCP Server đã chạy chưa
              </p>
            </div>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang kết nối đến MCP Server...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Products />

      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center focus:outline-none transition-transform ${
          isChatOpen ? "scale-0" : "scale-100"
        }`}
        aria-label="Open chat"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 21l1.8-4A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;
