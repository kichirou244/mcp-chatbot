import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { mcpClient } from "./client";
import HomePage from "./pages/Home";
import AuthPage from "./pages/Auth";
import { NotificationProvider } from "./contexts/NotificationContext";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const connectToServer = async () => {
      try {
        await mcpClient.connect(`${BASE_URL}/connect`);
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
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
};

export default App;
