import { useEffect, useState } from "react";
import Orders from "../../components/Cms/Orders/Orders";
import Sidebar from "../../components/Cms/Sidebar";
import Header from "../../layout/Header";
import { getOrders } from "../../actions/order.actions";
import { getProducts } from "../../actions/product.actions";
import { getUsers } from "../../actions/user.actions";
import { getOutlets } from "../../actions/outlet.actions";
import type { IOrder } from "../../types/Order";
import type { IProduct } from "../../types/Product";
import type { IUserResponse } from "../../types/User";
import type { IOutlet } from "../../types/Outlet";
import { useNotification } from "../../contexts/NotificationContext";

const OrdersPage = () => {
  const showNotification = useNotification();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [users, setUsers] = useState<IUserResponse[]>([]);
  const [outlets, setOutlets] = useState<IOutlet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, usersRes, outletsRes] = await Promise.all([
        getOrders(),
        getProducts(),
        getUsers(),
        getOutlets()
      ]);

      if (ordersRes.ok) setOrders(ordersRes.data);
      if (productsRes.ok) setProducts(productsRes.data);
      if (usersRes.ok) setUsers(usersRes.data);
      if (outletsRes.ok) setOutlets(outletsRes.data);
    } catch (error) {
      showNotification("Lỗi khi tải dữ liệu!", "error");
      console.error("Error fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex pt-3">
        <Sidebar />
        <div className="ml-64 flex-1 pt-12 bg-gray-100 overflow-hidden">
          <Orders 
            orders={orders}
            products={products}
            users={users}
            outlets={outlets}
            loading={loading}
            onRefresh={fetchData}
          />
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
