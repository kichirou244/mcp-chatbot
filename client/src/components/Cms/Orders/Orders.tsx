import { useState } from "react";
import { Table, Button, Space, Modal, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { IOrder } from "../../../types/Order";
import type { IProduct } from "../../../types/Product";
import {
  createOrder,
  updateOrder,
  deleteOrder,
} from "../../../actions/order.actions";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import OrderModal from "./OrderModal";
import type { IUserResponse } from "../../../types/User";
import { useNotification } from "../../../contexts/NotificationContext";
import type { IOutlet } from "../../../types/Outlet";

interface OrdersProps {
  orders: IOrder[];
  products: IProduct[];
  users: IUserResponse[];
  outlets: IOutlet[];
  loading: boolean;
  onRefresh: () => void;
}

export default function Orders({
  orders,
  products,
  users,
  outlets,
  loading,
  onRefresh,
}: OrdersProps) {
  const [modal, contextHolder] = Modal.useModal();
  const showNotification = useNotification();
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);

  const handleCreate = () => {
    setModalMode("create");
    setSelectedOrder(null);
    setModalOpen(true);
  };

  const handleEdit = (order: IOrder) => {
    setModalMode("edit");
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleView = (order: IOrder) => {
    setModalMode("view");
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleDelete = (order: IOrder) => {
    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa đơn hàng #${order.orderId}?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const result = await deleteOrder(order.orderId);
          if (result.ok) {
            showNotification("Xóa đơn hàng thành công!", "success");
            onRefresh();
          }
        } catch (error) {
          showNotification("Lỗi khi xóa đơn hàng!", "error");
        }
      },
    });
  };

  const handleModalSubmit = async (values: any) => {
    try {
      if (modalMode === "create") {
        const result = await createOrder(values);
        if (result.ok) {
          showNotification("Tạo đơn hàng thành công!", "success");
          setModalOpen(false);
          onRefresh();
        }
      } else if (modalMode === "edit" && selectedOrder) {
        const result = await updateOrder(selectedOrder.orderId, values);
        if (result.ok) {
          showNotification("Cập nhật đơn hàng thành công!", "success");
          setModalOpen(false);
          onRefresh();
        }
      }
    } catch (error) {
      showNotification(
        `Lỗi khi ${modalMode === "create" ? "tạo" : "cập nhật"} đơn hàng!`,
        "error"
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "orange";
      case "CONFIRMED":
        return "blue";
      case "DELIVERED":
        return "green";
      case "CANCELLED":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ xử lý";
      case "CONFIRMED":
        return "Đã xác nhận";
      case "DELIVERED":
        return "Đã giao";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const columns: ColumnsType<IOrder> = [
    {
      title: "Khách hàng",
      dataIndex: "userId",
      key: "userId",
      width: 120,
      render: (userId: number) => {
        const user = users.find((u) => u.id === userId);
        return user ? `${user.name}` : `KH #${userId}`;
      },
    },
    {
      title: "Ngày đặt",
      dataIndex: "date",
      key: "date",
      width: 100,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 100,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      filters: [
        { text: "< 1.000k", value: "1.000.000" },
        { text: "1.000k - 5.000k", value: "1.000.000-5.000.000" },
        { text: "5.000k - 10.000k", value: "5.000.000-10.000.000" },
        { text: "> 10.000k", value: "10.000.000" },
      ],
      onFilter: (value, record) => {
        const [min, max] = String(value).split("-").map(Number);

        if (min === 1000000) return record.totalAmount <= min;
        else if (min === 10000000) return record.totalAmount >= min;

        return record.totalAmount >= min && record.totalAmount <= max;
      },
      render: (amount: number) => (
        <span className="font-bold text-green-600">
          {amount.toLocaleString("vi-VN")}.000 vnđ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 70,
      filters: [
        { text: "Chờ xử lý", value: "PENDING" },
        { text: "Đã xác nhận", value: "CONFIRMED" },
        { text: "Đã giao", value: "DELIVERED" },
        { text: "Đã hủy", value: "CANCELLED" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Số lượng",
      key: "itemCount",
      width: 50,
      align: "center",
      render: (_, record) => (
        <span className="font-semibold">
          {record.orderDetails?.length || 0}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 60,
      render: (_: any, record: IOrder) => (
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
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-2xl font-bold">Quản lý đơn hàng</h2>
        <div className="flex items-center gap-2">
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Tạo đơn hàng
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="orderId"
        loading={loading}
        pagination={{
          pageSize: pageSize,
          pageSizeOptions: [5, 10, 20, 50],
          defaultPageSize: pageSize,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `Hiển thị ${range[0]}-${range[1]} trên tổng ${total} đơn hàng`,
          onChange: (_, size) => setPageSize(size || 10),
        }}
        bordered
        scroll={{ y: "calc(100vh - 280px)", x: 1200 }}
      />
      <OrderModal
        open={modalOpen}
        mode={modalMode}
        order={selectedOrder}
        users={users}
        products={products}
        outlets={outlets}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
      {contextHolder}
    </div>
  );
}
