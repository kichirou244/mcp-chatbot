import { useState } from "react";
import type { IRegisterRequest } from "@/types/Auth";
import { register } from "@/actions/auth.actions";
import { useNotification } from "@/contexts/NotificationContext";

export default function FormRegister({
  setIsLogin,
}: {
  setIsLogin: (value: boolean) => void;
}) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
    address: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const showNotification = useNotification();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = { ...form } as IRegisterRequest;

    try {
      const response = await register(formData);

      if (response.ok) {
        showNotification("Đăng ký thành công!", "success");

        setForm({
          username: "",
          password: "",
          name: "",
          phone: "",
          address: "",
        });

        setTimeout(() => {
          setIsLogin(true);
        }, 500);
      }
    } catch {
      showNotification("Đăng ký thất bại. Vui lòng thử lại.", "error");
    }
  };

  return (
    <>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Đăng ký
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
              type="text"
              autoComplete="username"
              required
              value={form.username}
              onChange={handleChange}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Tên đăng nhập"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 012.47-3.61M6.7 6.7A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-2.47 3.61M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9 9l18-18"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7.5 0C20.11 7.61 16.09 5 12 5S3.89 7.61 1.5 12c2.39 4.39 6.41 7 10.5 7s8.11-2.61 10.5-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="name" className="sr-only">
              Họ và tên
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Họ và tên"
            />
          </div>
          <div>
            <label htmlFor="phone" className="sr-only">
              Số điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={form.phone}
              onChange={handleChange}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Số điện thoại"
            />
          </div>
          <div>
            <label htmlFor="address" className="sr-only">
              Địa chỉ
            </label>
            <input
              id="address"
              name="address"
              type="text"
              autoComplete="street-address"
              required
              value={form.address}
              onChange={handleChange}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Địa chỉ"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold text-base shadow-md hover:from-blue-600 hover:to-blue-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            Đăng ký
          </button>
        </div>
      </form>
    </>
  );
}
