import { Modal, Form, Table, Tag } from "antd";
import { useEffect, useState } from "react";
import type { IOrder, IOrderDetail } from "@/types/Order";
import type { IUserResponse } from "@/types/User";
import type { IOutlet } from "@/types/Outlet";


interface OrderModalProps {
  open: boolean;
  order: IOrder | null;
  users: IUserResponse[];
  outlets: IOutlet[];
  onCancel: () => void;
}

const OrderModal = ({
  open,
  order,
  users,
  outlets,
  onCancel,
}: OrderModalProps) => {
  const [form] = Form.useForm();
  const [orderDetails, setOrderDetails] = useState<IOrderDetail[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (open && order) {
      form.setFieldsValue({
        userId: order.userId,
        status: order.status,
      });
      setOrderDetails(order.orderDetails || []);
    } else {
      form.resetFields();
      setOrderDetails([]);
    }
  }, [open, order, form]);

  useEffect(() => {
    const total = orderDetails.reduce(
      (sum, detail) => sum + detail.unitPrice * detail.quantity,
      0
    );
    setTotalAmount(total);
  }, [orderDetails]);

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

  const getName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.name} (${user.username})` : "";
  };

  const detailColumns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Sản phẩm",
      key: "productId",
      width: 250,
      render: (_: any, record: IOrderDetail) => (
        <span>{record.productName}</span>
      ),
    },
    {
      title: "Đơn giá",
      key: "unitPrice",
      width: 120,
      render: (_: any, record: IOrderDetail) => (
        <span className="font-semibold text-green-600">
          {record.unitPrice.toLocaleString("vi-VN")} vnđ
        </span>
      ),
    },
    {
      title: "Số lượng",
      key: "quantity",
      width: 100,
      render: (_: any, record: IOrderDetail) => <span>{record.quantity}</span>,
    },
    {
      title: "Cửa hàng",
      key: "outletId",
      width: 150,
      render: (_: any, record: IOrderDetail) => {
        console.log(record.outletId);
        const outlet = outlets.find((o) => o.id === record.outletId);
        if (outlet) {
          return <span>{outlet.name}</span>;
        }
      },
    },
    {
      title: "Thành tiền",
      key: "subtotal",
      width: 130,
      render: (_: any, record: IOrderDetail) => (
        <span className="font-bold text-blue-600">
          {(record.unitPrice * record.quantity).toLocaleString("vi-VN")}.000đ
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={`Chỉnh sửa đơn hàng #${order?.orderId}`}
      open={open}
      onCancel={onCancel}
      okButtonProps={{ style: { display: "none" } }}
      width={900}
      maskClosable={false}
    >
      <Form form={form} layout="vertical" disabled className="mt-4">
        {order && (
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span>Người đặt: {getName(order?.userId || 0)}</span>
              </div>
              <div>
                <span className="font-semibold">Ngày đặt: </span>
                {new Date(order.date).toLocaleString("vi-VN")}
              </div>
              <div>
                <span className="font-semibold">Trạng thái: </span>
                <Tag color={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Tag>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Chi tiết đơn hàng</h3>
          </div>

          <Table
            columns={detailColumns}
            dataSource={orderDetails}
            pagination={false}
            rowKey={(_, index) => index || 0}
            size="small"
            bordered
            scroll={{ x: 800 }}
          />

          <div className="mt-4 flex justify-end">
            <div className="bg-blue-50 px-6 py-3 rounded-lg">
              <span className="text-lg font-semibold mr-2">Tổng tiền:</span>
              <span className="text-xl font-bold text-blue-600">
                {totalAmount.toLocaleString("vi-VN")}.000đ
              </span>
            </div>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default OrderModal;
