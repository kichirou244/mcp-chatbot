import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../actions/auth.actions";
import { useNotification } from "../../contexts/NotificationContext";

export default function FormLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = { username, password };
      const response = await login(formData);

      if (response) {
        showNotification("Đăng nhập thành công!", "success");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      }
    } catch (error) {
      showNotification("Đăng nhập thất bại. Vui lòng thử lại.", "error");
    }
  };

  return (
    <>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Đăng nhập
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="username" className="sr-only">
              Tên đăng nhập
            </label>
            <input
              id="username"
              name="username"
              type="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Tên đăng nhập"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Mật khẩu"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Đăng nhập
          </button>
        </div>
      </form>
    </>
  );
}
