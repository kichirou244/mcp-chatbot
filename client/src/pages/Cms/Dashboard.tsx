import Sidebar from "../../components/Cms/Sidebar";
import Header from "../../layout/Header";
import TopProducts from "../../components/Cms/Dashboard/TopProducts";
import TopUsers from "../../components/Cms/Dashboard/TopUsers";

const Dashboard = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex pt-3">
        <Sidebar />
        <div className="ml-64 pt-12 flex-1 p-8 bg-gray-100 min-h-[calc(100vh-1rem)]">
          <h1 className="text-3xl font-bold mt-2 mb-6">Trang chủ</h1>

          <TopProducts />
          <TopUsers />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
