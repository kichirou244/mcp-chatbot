import { useEffect, useState } from "react";
import type { IProduct } from "../types/Product";
import { getProducts } from "../actions/product.actions";

export function Products() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error("[COMPONENT] Error:", err);
      setError(err?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleProductsUpdate = () => {
      fetchProducts();
    };

    window.addEventListener("products-updated", handleProductsUpdate);

    return () => {
      window.removeEventListener("products-updated", handleProductsUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 text-lg">❌ {error}</p>
          <p className="text-gray-600 mt-2">Không thể tải danh sách sản phẩm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-semibold text-lg text-gray-800">
                  {product.name}
                </h2>
              </div>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {product.description}
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <p className="text-xl font-bold text-green-600">
                  {product.price} vnđ
                </p>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Số lượng</p>
                  <p className="text-base font-semibold text-gray-700">
                    {product.quantity}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
