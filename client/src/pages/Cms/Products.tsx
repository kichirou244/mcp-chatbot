import Sidebar from "../../components/Cms/Sidebar";
import Products from "../../components/Cms/Products/Products";
import Header from "../../layout/Header";

const Dashboard = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex pt-3">
        <Sidebar />
        <div className="ml-64 flex-1 pt-12 bg-gray-100 overflow-hidden">
          <Products />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
