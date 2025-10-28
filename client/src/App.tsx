import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/Home";
import AuthPage from "./pages/Auth";
import CmsDashboard from "./pages/Cms/Dashboard";
import CmsProducts from "./pages/Cms/Products";
import CmsOrders from "./pages/Cms/Orders";
import CmsOutlets from "./pages/Cms/Outlets";
import ChatSessionsPage from "./pages/Cms/ChatSessions";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

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
            <Route
              path="/cms/chat-sessions"
              element={
                <ProtectedRoute>
                  <ChatSessionsPage />
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
