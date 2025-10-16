import { useEffect, useState } from "react";
import { Card, Table, Tag, message, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getTopUsers } from "../../../actions/order.actions";
import {
  CrownOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { ITopUser } from "../../../types/Order";

export default function TopUsers() {
  const [topUsers, setTopUsers] = useState<ITopUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTopUsers = async () => {
    setLoading(true);
    try {
      const result = await getTopUsers(5);
      if (result.ok) {
        setTopUsers(result.data);
      } else {
        message.error("Không thể tải danh sách khách hàng VIP!");
      }
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu!");
      console.error("Error fetching top users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopUsers();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

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
      render: (text: string, record: ITopUser, index: number) => (
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
  ];

  return (
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
  );
}
