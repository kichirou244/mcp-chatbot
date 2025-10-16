import Orders from "../../components/Cms/Orders/Orders";
import Sidebar from "../../components/Cms/Sidebar";
import Header from "../../layout/Header";

const OrdersPage = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex pt-3">
        <Sidebar />
        <div className="ml-64 flex-1 pt-12 bg-gray-100 overflow-hidden">
          <Orders />
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
