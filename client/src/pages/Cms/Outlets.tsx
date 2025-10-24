import { useEffect, useState } from "react";
import Sidebar from "@/components/Cms/Sidebar";
import Outlets from "@/components/Cms/Outlets/Outlets";
import Header from "@/layout/Header";
import { getOutlets } from "@/actions/outlet.actions";
import type { IOutlet } from "@/types/Outlet";
import { useNotification } from "@/contexts/NotificationContext";

const OutletsPage = () => {
  const showNotification = useNotification();
  const [outlets, setOutlets] = useState<IOutlet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const outletsRes = await getOutlets();
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
          <Outlets 
            outlets={outlets}
            loading={loading}
            onRefresh={fetchData}
          />
        </div>
      </div>
    </div>
  );
};

export default OutletsPage;
