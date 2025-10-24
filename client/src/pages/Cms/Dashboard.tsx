import { useEffect, useState } from "react";
import Sidebar from "@/components/Cms/Sidebar";
import Header from "@/layout/Header";
import TopProducts from "@/components/Cms/Dashboard/TopProducts";
import TopUsers from "@/components/Cms/Dashboard/TopUsers";
import {
  getMonthlyRevenue,
  getTopProducts,
  getTopUsers,
} from "@/actions/order.actions";
import type { IOrderRevenue, ITopProduct, ITopUser } from "@/types/Order";
import { message } from "antd";
import Chart from "@/components/Cms/Dashboard/Chart";

const Dashboard = () => {
  const [topProducts, setTopProducts] = useState<ITopProduct[]>([]);
  const [topUsers, setTopUsers] = useState<ITopUser[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<IOrderRevenue[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, usersRes, monthlyRevenueRes] = await Promise.all([
        getTopProducts(5),
        getTopUsers(5),
        getMonthlyRevenue(),
      ]);

      setTopProducts(productsRes.data);
      setTopUsers(usersRes.data);
      setMonthlyRevenue(monthlyRevenueRes.data);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu!");
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex pt-3">
        <Sidebar />
        <div className="ml-64 pt-12 flex-1 p-8 bg-gray-100 min-h-[calc(100vh-1rem)]">
          <h1 className="text-3xl font-bold mt-2 mb-6">Trang chủ</h1>

          <Chart monthlyRevenue={monthlyRevenue} loading={loading} />
          <TopProducts topProducts={topProducts} loading={loading} />
          <TopUsers topUsers={topUsers} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
