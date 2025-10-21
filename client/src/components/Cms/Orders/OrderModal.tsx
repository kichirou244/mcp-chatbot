import {
  Modal,
  Form,
  Select,
  InputNumber,
  Table,
  Button,
  message,
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import type { IOrder, IOrderDetail } from "../../../types/Order";
import type { IProduct } from "../../../types/Product";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { IUserResponse } from "../../../types/User";
import type { IOutlet } from "../../../types/Outlet";

interface OrderModalProps {
  open: boolean;
  mode: "create" | "edit" | "view";
  order: IOrder | null;
  users: IUserResponse[];
  products: IProduct[];
  outlets: IOutlet[];
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
}

const OrderModal = ({
  open,
  mode,
  order,
  users,
  outlets,
  products,
  onCancel,
  onSubmit,
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

  const handleAddProduct = () => {
    const newDetail: IOrderDetail = {
      productId: 0,
      quantity: 1,
      unitPrice: 0,
    };
    setOrderDetails([...orderDetails, newDetail]);
  };

  const handleRemoveProduct = (index: number) => {
    const newDetails = orderDetails.filter((_, i) => i !== index);
    setOrderDetails(newDetails);
  };

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const newDetails = [...orderDetails];
      newDetails[index] = {
        ...newDetails[index],
        productId,
        productName: product.name,
        productDescription: product.description,
        unitPrice: product.price,
        outletId: product.outletId,
      };
      setOrderDetails(newDetails);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newDetails = [...orderDetails];
    newDetails[index] = {
      ...newDetails[index],
      quantity,
      subtotal: newDetails[index].unitPrice * quantity,
    };
    setOrderDetails(newDetails);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (orderDetails.length === 0) {
        message.error("Vui lòng thêm ít nhất một sản phẩm!");
        return;
      }

      const hasInvalidProducts = orderDetails.some(
        (detail) => !detail.productId || detail.productId === 0
      );
      if (hasInvalidProducts) {
        message.error("Vui lòng chọn sản phẩm cho tất cả các dòng!");
        return;
      }

      const submitData = {
        userId: values.userId,
        status: values.status || "PENDING",
        orderDetails: orderDetails.map((detail) => ({
          id: detail.id,
          productId: detail.productId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
        })),
      };

      await onSubmit(submitData);
      form.resetFields();
      setOrderDetails([]);
    } catch (error) {
      message.error("Vui lòng kiểm tra lại thông tin!");
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Tạo đơn hàng mới";
      case "edit":
        return `Chỉnh sửa đơn hàng #${order?.orderId}`;
      case "view":
        return `Chi tiết đơn hàng #${order?.orderId}`;
      default:
        return "";
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
      render: (_: any, record: IOrderDetail, index: number) =>
        mode === "view" ? (
          <span>{record.productName}</span>
        ) : (
          <Select
            placeholder="Chọn sản phẩm"
            value={record.productId || undefined}
            onChange={(value) => handleProductChange(index, value)}
            className="w-full"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={products.map((product) => ({
              value: product.id,
              label: product.name,
            }))}
          />
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
      render: (_: any, record: IOrderDetail, index: number) =>
        mode === "view" ? (
          <span>{record.quantity}</span>
        ) : (
          <InputNumber
            min={1}
            value={record.quantity}
            onChange={(value) => handleQuantityChange(index, value || 1)}
            className="w-full"
          />
        ),
    },
    {
      title: "Cửa hàng",
      key: "outletId",
      width: 150,
      render: (_: any, record: IOrderDetail) => {
        console.log(record.outletId)
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
    ...(mode !== "view"
      ? [
          {
            title: "Thao tác",
            key: "action",
            width: 80,
            render: (_: any, __: any, index: number) => (
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveProduct(index)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <Modal
      title={getTitle()}
      open={open}
      onCancel={onCancel}
      onOk={mode !== "view" ? handleSubmit : onCancel}
      okText={
        mode === "view" ? "Đóng" : mode === "create" ? "Tạo mới" : "Cập nhật"
      }
      cancelText={mode === "view" ? undefined : "Hủy"}
      width={900}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={mode === "view"}
        className="mt-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="userId"
            label="Khách hàng"
            rules={[{ required: true, message: "Vui lòng chọn khách hàng!" }]}
          >
            <Select
              placeholder="Chọn khách hàng"
              showSearch
              optionFilterProp="children"
              options={users.map((user) => ({
                value: user.id,
                label: `${user.name} (${user.username})` || `User #${user.id}`,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            initialValue="PENDING"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
          >
            <Select
              placeholder="Chọn trạng thái"
              disabled={mode === "view" || mode === "create"}
              options={[
                { value: "PENDING", label: "Chờ xử lý" },
                { value: "CONFIRMED", label: "Đã xác nhận" },
                { value: "DELIVERED", label: "Đã giao" },
                { value: "CANCELLED", label: "Đã hủy" },
              ]}
            />
          </Form.Item>
        </div>

        {mode === "view" && order && (
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <div className="grid grid-cols-2 gap-4">
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
            {mode !== "view" && (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddProduct}
              >
                Thêm sản phẩm
              </Button>
            )}
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
