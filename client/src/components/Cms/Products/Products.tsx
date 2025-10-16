import { useEffect, useState } from "react";
import { Table, Button, Space, message, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { IProduct, IProductCreate } from "../../../types/Product";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../../actions/product.actions";
import type { IOutlet } from "../../../types/Outlet";
import { getOutlets } from "../../../actions/outlet.actions";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import ProductModal from "./ProductModal";

export default function Products() {
  const [modal, contextHolder] = Modal.useModal();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [outlets, setOutlets] = useState<IOutlet[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

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
      message.error("Lỗi khi tải dữ liệu!");
      console.error("Error fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setModalMode("create");
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: IProduct) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleView = (product: IProduct) => {
    setModalMode("view");
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleDelete = (product: IProduct) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const result = await deleteProduct(product.id);
          if (result.ok) {
            message.success("Xóa sản phẩm thành công!");
            fetchData();
          }
        } catch (error) {
          message.error("Lỗi khi xóa sản phẩm!");
        }
      },
    });
  };

  const handleModalSubmit = async (values: IProductCreate) => {
    try {
      if (modalMode === "create") {
        const result = await createProduct(values);
        if (result.ok) {
          message.success("Tạo sản phẩm thành công!");
          setModalOpen(false);
          fetchData();
        }
      } else if (modalMode === "edit" && selectedProduct) {
        const result = await updateProduct(selectedProduct.id, values);
        if (result.ok) {
          message.success("Cập nhật sản phẩm thành công!");
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (error) {
      message.error(
        `Lỗi khi ${modalMode === "create" ? "tạo" : "cập nhật"} sản phẩm!`
      );
    }
  };

  const columns: ColumnsType<IProduct> = [
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      filterSearch: true,
      width: 150,
      ellipsis: true,
      render: (text: string) => <span className="truncate">{text}</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => <span className="truncate">{text}</span>,
      width: 250,
    },
    {
      title: "Giá (vnđ)",
      dataIndex: "price",
      key: "price",
      width: 100,
      sorter: (a, b) => a.price - b.price,
      render: (price: number) => (
        <span className="font-semibold text-green-600 block text-center">
          {price.toLocaleString("vi-VN")}.000
        </span>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 90,
      sorter: (a, b) => a.quantity - b.quantity,
      render: (quantity: number) => (
        <span
          className={`inline-block min-w-[70px] text-center px-2 py-1 rounded ${
            quantity > 0
              ? "bg-green-100 text-green-700 border border-green-400"
              : "bg-red-100 text-red-700 border border-red-400"
          }`}
        >
          {quantity > 0 ? `Còn ${quantity}` : "Hết hàng"}
        </span>
      ),
    },
    {
      title: "Cửa hàng",
      dataIndex: "outletId",
      key: "outletId",
      width: 100,
      render: (outletId: number) => {
        const outletName =
          outlets.find((outlet) => outlet.id === outletId)?.name ||
          "Không xác định";
        return (
          <span
            className="truncate max-w-[100px] inline-block align-middle overflow-hidden text-ellipsis whitespace-nowrap"
            title={outletName}
          >
            {outletName}
          </span>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      render: (_: any, record: IProduct) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          />
          <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col min-h-[600px]">
      <div className="mb-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-2xl font-bold">Quản lý sản phẩm</h2>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Thêm sản phẩm
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: pageSize,
          pageSizeOptions: [5, 10, 20, 50],
          defaultPageSize: pageSize,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `Hiển thị ${range[0]}-${range[1]} trên tổng ${total} sản phẩm`,
          onChange: (_, size) => setPageSize(size || 10),
        }}
        bordered
        scroll={{ y: 400, x: 1200 }}
      />
      <ProductModal
        open={modalOpen}
        mode={modalMode}
        product={selectedProduct}
        outlets={outlets}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
      {contextHolder}
    </div>
  );
}
