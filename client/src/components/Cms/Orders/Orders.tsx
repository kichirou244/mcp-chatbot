import { useState } from "react";
import { Table, Button, Modal, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { IOrder } from "@/types/Order";

import { EyeOutlined } from "@ant-design/icons";
import OrderModal from "./OrderModal";
import type { IUserResponse } from "@/types/User";
import { useNotification } from "@/contexts/NotificationContext";
import type { IOutlet } from "@/types/Outlet";
import { updateOrder } from "@/actions/order.actions";

interface OrdersProps {
  orders: IOrder[];
  users: IUserResponse[];
  outlets: IOutlet[];
  loading: boolean;
  onRefresh: () => void;
}

export default function Orders({
  orders,
  users,
  outlets,
  loading,
  onRefresh,
}: OrdersProps) {
  const [modal, contextHolder] = Modal.useModal();
  const showNotification = useNotification();
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);

  const handleView = (order: IOrder) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const response = await updateOrder(orderId, { status: newStatus });
      if (response.ok) {
        showNotification("Cập nhật trạng thái đơn hàng thành công", "success");
        onRefresh();
      } else {
        showNotification("Không thể cập nhật trạng thái đơn hàng", "error");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showNotification("Đã xảy ra lỗi khi cập nhật trạng thái", "error");
    }
  };

  const columns: ColumnsType<IOrder> = [
    {
      title: "Khách hàng",
      dataIndex: "userId",
      key: "userId",
      width: 15,
      render: (userId: number) => {
        const user = users.find((u) => u.id === userId);
        return user ? `${user.name}` : `KH #${userId}`;
      },
    },
    {
      title: "Ngày đặt",
      dataIndex: "date",
      key: "date",
      width: 15,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 15,
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
          {amount.toLocaleString("vi-VN")} vnđ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 10,
      filters: [
        { text: "Chờ xử lý", value: "PENDING" },
        { text: "Đã xác nhận", value: "CONFIRMED" },
        { text: "Đã giao", value: "DELIVERED" },
        { text: "Đã hủy", value: "CANCELLED" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string, record: IOrder) => {
        return (
          <Select
            value={status}
            onChange={(newStatus) =>
              handleStatusChange(record.orderId, newStatus)
            }
            style={{
              width: 100,
            }}
            options={[
              { label: "Chờ xử lý", value: "PENDING" },
              { label: "Đã xác nhận", value: "CONFIRMED" },
              { label: "Đã giao", value: "DELIVERED" },
              { label: "Đã hủy", value: "CANCELLED" },
            ]}
          />
        );
      },
    },
    {
      title: "Số lượng",
      key: "itemCount",
      width: 10,
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
      width: 10,
      render: (_: any, record: IOrder) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        />
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-2xl font-bold">Quản lý đơn hàng</h2>
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
        order={selectedOrder}
        users={users}
        outlets={outlets}
        onCancel={() => setModalOpen(false)}
      />
      {contextHolder}
    </div>
  );
}
