import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: "/cms", label: "Trang chủ" },
    { path: "/cms/outlets", label: "Cửa hàng" },
    { path: "/cms/products", label: "Sản phẩm" },
    { path: "/cms/orders", label: "Hoá đơn" },
    { path: "/cms/chat-sessions", label: "Chat Sessions" },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white text-gray-900 flex flex-col border-r border-gray-200 z-30">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-xl mt-3 font-bold">CMS</h2>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded transition-colors ${
                  location.pathname === item.path
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
