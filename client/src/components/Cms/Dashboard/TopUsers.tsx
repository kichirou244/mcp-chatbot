import { useState } from "react";
import { Card, Table, Tag, message, Spin, Modal, Descriptions } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getOrdersByUser } from "@/actions/order.actions";
import {
  CrownOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ITopUser, IOrder } from "@/types/Order";

interface TopUsersProps {
  topUsers: ITopUser[];
  loading: boolean;
}

export default function TopUsers({ topUsers, loading }: TopUsersProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ITopUser | null>(null);
  const [userOrders, setUserOrders] = useState<IOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const handleViewOrders = async (user: ITopUser) => {
    setSelectedUser(user);
    setModalVisible(true);
    setLoadingOrders(true);
    try {
      const result = await getOrdersByUser(user.userId);
      if (result.ok) {
        setUserOrders(result.data);
      } else {
        message.error("Không thể tải danh sách hóa đơn!");
      }
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu hóa đơn!");
      console.error("Error fetching user orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const orderColumns: ColumnsType<IOrder> = [
    {
      title: "Mã HĐ",
      dataIndex: "orderId",
      key: "orderId",
      width: 80,
      render: (id: number) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "date",
      key: "date",
      render: (date: string) => formatDateTime(date),
    },
    {
      title: "Sản phẩm",
      key: "products",
      render: (_: any, record: IOrder) => (
        <div>
          {record.orderDetails.slice(0, 2).map((detail, idx) => (
            <div key={idx} style={{ fontSize: "12px" }}>
              • {detail.productName} x{detail.quantity}
            </div>
          ))}
          {record.orderDetails.length > 2 && (
            <div style={{ fontSize: "12px", color: "#888" }}>
              +{record.orderDetails.length - 2} sản phẩm khác
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      render: (value: number) => (
        <span style={{ color: "#52c41a", fontWeight: "bold" }}>
          {Number(value).toLocaleString("vi-VN")}.000 vnđ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string) => {
        const statusColors: Record<string, string> = {
          PENDING: "orange",
          CONFIRMED: "blue",
          DELIVERED: "green",
          CANCELLED: "red",
        };
        return <Tag color={statusColors[status] || "default"}>{status}</Tag>;
      },
    },
  ];

  const columns: ColumnsType<ITopUser> = [
    {
      title: "Xếp hạng",
      key: "rank",
      width: 80,
      align: "center",
      render: (_: any, __: ITopUser, index: number) => {
        const colors = ["gold", "silver", "brown"];
        const color = colors[index] || "default";
        return (
          <Tag color={color} style={{ fontSize: "16px", fontWeight: "bold" }}>
            #{index + 1}
          </Tag>
        );
      },
    },
    {
      title: "Tên khách hàng",
      dataIndex: "userName",
      key: "userName",
      render: (text: string, _: ITopUser, index: number) => (
        <div>
          <strong>{text}</strong>
          {index < 3 && (
            <CrownOutlined
              style={{
                marginLeft: 8,
                color:
                  index === 0 ? "#faad14" : index === 1 ? "#d9d9d9" : "#cd7f32",
              }}
            />
          )}
        </div>
      ),
    },
    {
      title: "Liên hệ",
      key: "contact",
      render: (_: any, record: ITopUser) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <PhoneOutlined style={{ marginRight: 6, color: "#1890ff" }} />
            {record.userPhone}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            <EnvironmentOutlined style={{ marginRight: 6 }} />
            {record.userAddress}
          </div>
        </div>
      ),
    },
    {
      title: "Tổng chi tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      align: "right",
      sorter: (a, b) => a.totalSpent - b.totalSpent,
      render: (value: string) => (
        <span
          style={{ color: "#52c41a", fontWeight: "bold", fontSize: "15px" }}
        >
          {parseInt(value).toLocaleString("vi-VN")}.000 vnđ
        </span>
      ),
    },
    {
      title: "Số đơn hàng",
      dataIndex: "orderCount",
      key: "orderCount",
      align: "center",
      sorter: (a, b) => a.orderCount - b.orderCount,
      render: (value: number) => (
        <Tag color="blue" style={{ fontSize: "14px" }}>
          {value} đơn
        </Tag>
      ),
    },
    {
      title: "Đơn gần nhất",
      dataIndex: "lastOrderDate",
      key: "lastOrderDate",
      align: "center",
      render: (date: string) => <Tag color="cyan">{formatDate(date)}</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 100,
      render: (_: any, record: ITopUser) => (
        <EyeOutlined
          style={{ fontSize: "18px", color: "#1890ff", cursor: "pointer" }}
          onClick={() => handleViewOrders(record)}
        />
      ),
    },
  ];

  return (
    <>
      <Card
        title={<span>Top 5 Khách Hàng VIP</span>}
        style={{ marginBottom: 24 }}
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={topUsers}
            rowKey="userId"
            pagination={false}
            size="middle"
            locale={{
              emptyText: "Chưa có dữ liệu khách hàng",
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={<span>Lịch sử mua hàng - {selectedUser?.userName}</span>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
      >
        <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Tên khách hàng">
            <strong>{selectedUser?.userName}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            <PhoneOutlined style={{ marginRight: 6, color: "#1890ff" }} />
            {selectedUser?.userPhone}
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">
            <EnvironmentOutlined style={{ marginRight: 6 }} />
            {selectedUser?.userAddress}
          </Descriptions.Item>
          <Descriptions.Item label="Tổng chi tiêu">
            <span
              style={{ color: "#52c41a", fontWeight: "bold", fontSize: "15px" }}
            >
              {parseInt(
                selectedUser?.totalSpent.toString() || "0"
              ).toLocaleString("vi-VN")}
              .000 vnđ
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Số đơn hàng">
            <Tag color="blue" style={{ fontSize: "14px" }}>
              {selectedUser?.orderCount} đơn
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Đơn hàng gần nhất" span={2}>
            <Tag color="cyan">
              {selectedUser?.lastOrderDate &&
                formatDate(selectedUser.lastOrderDate)}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Spin spinning={loadingOrders}>
          <Table
            columns={orderColumns}
            dataSource={userOrders}
            rowKey="orderId"
            pagination={{ pageSize: 5 }}
            size="small"
            locale={{
              emptyText: "Chưa có hóa đơn nào",
            }}
          />
        </Spin>
      </Modal>
    </>
  );
}
