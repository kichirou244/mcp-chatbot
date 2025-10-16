import Sidebar from "../../components/Cms/Sidebar";
import Outlets from "../../components/Cms/Outlets/Outlets";
import Header from "../../layout/Header";

const OutletsPage = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex pt-3">
        <Sidebar />
        <div className="ml-64 flex-1 pt-12 bg-gray-100 overflow-hidden">
          <Outlets />
        </div>
      </div>
    </div>
  );
};

export default OutletsPage;
