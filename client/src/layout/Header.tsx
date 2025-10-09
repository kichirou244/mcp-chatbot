import { NavLink } from "react-router-dom";
import { useNotification } from "../contexts/NotificationContext";

export default function Header() {
  const accessToken = localStorage.getItem("accessToken");
  const { showNotification } = useNotification();

  return (
    <header className="w-full flex justify-between items-center px-8 py-4 bg-white shadow-sm fixed top-0 left-0 z-20">
      <h1 className="text-xl font-bold text-gray-800">Danh sách sản phẩm</h1>
      {!accessToken ? (
        <NavLink
          to="/auth"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow transition-colors flex items-center"
        >
          Đăng nhập
        </NavLink>
      ) : (
        <button
          onClick={() => {
            localStorage.removeItem("accessToken");

            showNotification("Đăng xuất thành công!", "success");

            setTimeout(() => {
              window.location.reload();
            }, 500);
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg shadow transition-colors flex items-center"
        >
          Đăng xuất
        </button>
      )}
    </header>
  );
}
