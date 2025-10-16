import { useEffect, useState } from "react";
import { Card, Table, Tag, message, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getTopProducts } from "../../../actions/order.actions";
import type { ITopProduct } from "../../../types/Order";

export default function TopProducts() {
  const [topProducts, setTopProducts] = useState<ITopProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTopProducts = async () => {
    setLoading(true);
    try {
      const result = await getTopProducts(5);
      if (result.ok) {
        setTopProducts(result.data);
      } else {
        message.error("Không thể tải danh sách sản phẩm bán chạy!");
      }
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu!");
      console.error("Error fetching top products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const columns: ColumnsType<ITopProduct> = [
    {
      title: "Xếp hạng",
      key: "rank",
      width: 100,
      align: "center",
      render: (_: any, __: ITopProduct, index: number) => {
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
      title: "Tên sản phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Số lượng đã bán",
      dataIndex: "totalQuantitySold",
      key: "totalQuantitySold",
      align: "right",
      render: (value: number) => (
        <Tag color="blue" style={{ fontSize: "14px" }}>
          {value.toLocaleString()} sản phẩm
        </Tag>
      ),
    },
    {
      title: "Doanh thu",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      align: "right",
      render: (value: number) => (
        <span style={{ color: "#52c41a", fontWeight: "bold" }}>
          {Number(value).toLocaleString("vi-VN")}.000 vnđ
        </span>
      ),
    },
    {
      title: "Số đơn hàng",
      dataIndex: "orderCount",
      key: "orderCount",
      align: "center",
      render: (value: number) => <Tag color="purple">{value} đơn</Tag>,
    },
  ];

  return (
    <Card
      title={<span>Top 5 Sản Phẩm Bán Chạy Nhất</span>}
      style={{ marginBottom: 24 }}
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={topProducts}
          rowKey="productId"
          pagination={false}
          size="middle"
          locale={{
            emptyText: "Chưa có dữ liệu sản phẩm",
          }}
        />
      </Spin>
    </Card>
  );
}
