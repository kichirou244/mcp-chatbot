import { NavLink } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";
import { logout } from "../actions/auth.actions";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { isAuthenticated, logout: authLogout } = useAuth();
  const showNotification = useNotification();

  return (
    <header className="w-full flex justify-between items-center px-8 py-4 bg-white shadow-sm fixed top-0 left-0 z-20">
      <h1></h1>
      {!isAuthenticated ? (
        <NavLink
          to="/auth"
          className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-1 rounded-full shadow-md transition-all duration-200 font-semibold tracking-wide flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Đăng nhập
        </NavLink>
      ) : (
        <button
          onClick={async () => {
            await logout();
            authLogout();

            showNotification("Đăng xuất thành công!", "success");

            setTimeout(() => {
              window.location.reload();
            }, 500);
          }}
          className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white px-6 py-1 rounded-full shadow-md transition-all duration-200 font-semibold tracking-wide flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Đăng xuất
        </button>
      )}
    </header>
  );
}
