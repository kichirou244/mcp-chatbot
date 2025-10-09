import { useState } from "react";
import FormLogin from "./FormLogin";
import FormRegister from "./FormRegister";
import { NavLink } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {isLogin ? <FormLogin /> : <FormRegister setIsLogin={setIsLogin} />}

        <div className="flex justify-between items-center mt-4">
          <button
            type="button"
            onClick={isLogin ? () => setIsLogin(false) : () => setIsLogin(true)}
            className="text-blue-600 hover:text-blue-500"
          >
            {isLogin
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </button>
          <NavLink
            to="/"
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Về trang chủ
          </NavLink>
        </div>
      </div>
    </div>
  );
}
