import { useEffect, useState } from "react";
import Sidebar from "@/components/Cms/Sidebar";
import Products from "@/components/Cms/Products/Products";
import Header from "@/layout/Header";
import { getProducts } from "@/actions/product.actions";
import { getOutlets } from "@/actions/outlet.actions";
import type { IProduct } from "@/types/Product";
import type { IOutlet } from "@/types/Outlet";
import { useNotification } from "@/contexts/NotificationContext";

const ProductsPage = () => {
  const showNotification = useNotification();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [outlets, setOutlets] = useState<IOutlet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, outletsRes] = await Promise.all([
        getProducts(),
        getOutlets(),
      ]);

      if (productsRes.ok) setProducts(productsRes.data);
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
          <Products 
            products={products}
            outlets={outlets}
            loading={loading}
            onRefresh={fetchData}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
