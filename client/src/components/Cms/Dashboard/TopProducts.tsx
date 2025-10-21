import { useState } from "react";
import { Card, Table, Tag, message, Spin, Modal, Descriptions } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  getOrdersByProduct,
} from "../../../actions/order.actions";
import type { ITopProduct } from "../../../types/Order";
import type { IOrder } from "../../../types/Order";
import { EyeOutlined } from "@ant-design/icons";

interface TopProductsProps {
  topProducts: ITopProduct[];
  loading: boolean;
}

export default function TopProducts({ topProducts, loading }: TopProductsProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ITopProduct | null>(
    null
  );
  const [productOrders, setProductOrders] = useState<IOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const handleViewOrders = async (product: ITopProduct) => {
    setSelectedProduct(product);
    setModalVisible(true);
    setLoadingOrders(true);
    try {
      const result = await getOrdersByProduct(product.productId);
      if (result.ok) {
        setProductOrders(result.data);
      } else {
        message.error("Không thể tải danh sách hóa đơn!");
      }
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu hóa đơn!");
      console.error("Error fetching product orders:", error);
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
      render: (date: string) => formatDate(date),
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
          COMPLETED: "green",
          CANCELLED: "red",
        };
        return <Tag color={statusColors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Sản phẩm",
      key: "products",
      render: (_: any, record: IOrder) => {
        const productDetail = record.orderDetails.find(
          (detail) => detail.productId === selectedProduct?.productId
        );
        return productDetail ? (
          <Tag color="purple">{productDetail.quantity} sản phẩm</Tag>
        ) : (
          "-"
        );
      },
    },
  ];

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
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      width: 100,
      render: (_: any, record: ITopProduct) => (
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

      <Modal
        title={<span>Danh sách hóa đơn - {selectedProduct?.productName}</span>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Tên sản phẩm">
            <strong>{selectedProduct?.productName}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Số đơn hàng">
            <Tag color="purple">{selectedProduct?.orderCount} đơn</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tổng số lượng bán">
            <Tag color="blue" style={{ fontSize: "14px" }}>
              {selectedProduct?.totalQuantitySold.toLocaleString()} sản phẩm
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tổng doanh thu">
            <span style={{ color: "#52c41a", fontWeight: "bold" }}>
              {Number(selectedProduct?.totalRevenue).toLocaleString("vi-VN")}
              .000 vnđ
            </span>
          </Descriptions.Item>
        </Descriptions>

        <Spin spinning={loadingOrders}>
          <Table
            columns={orderColumns}
            dataSource={productOrders}
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
