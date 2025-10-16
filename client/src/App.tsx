import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { mcpClient } from "./client";
import HomePage from "./pages/Home";
import AuthPage from "./pages/Auth";
import CmsDashboard from "./pages/Cms/Dashboard";
import CmsProducts from "./pages/Cms/Products";
import CmsOrders from "./pages/Cms/Orders";
import CmsOutlets from "./pages/Cms/Outlets";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

const GuestRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading)
    return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading)
    return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

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
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/auth"
              element={
                <GuestRoute>
                  <AuthPage />
                </GuestRoute>
              }
            />

            <Route
              path="/cms"
              element={
                <ProtectedRoute>
                  <CmsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms/products"
              element={
                <ProtectedRoute>
                  <CmsProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms/orders"
              element={
                <ProtectedRoute>
                  <CmsOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cms/outlets"
              element={
                <ProtectedRoute>
                  <CmsOutlets />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
