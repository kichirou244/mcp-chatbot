import { useEffect, useState } from "react";
import { Table, Button, Space, message, Modal, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { IOutlet } from "../../../types/Outlet";
import {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
} from "../../../actions/outlet.actions";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import OutletModal from "./OutletModal";

export default function Outlets() {
  const [modal, contextHolder] = Modal.useModal();
  const [outlets, setOutlets] = useState<IOutlet[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedOutlet, setSelectedOutlet] = useState<IOutlet | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const outletsRes = await getOutlets();
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
    setSelectedOutlet(null);
    setModalOpen(true);
  };

  const handleEdit = (outlet: IOutlet) => {
    setModalMode("edit");
    setSelectedOutlet(outlet);
    setModalOpen(true);
  };

  const handleView = (outlet: IOutlet) => {
    setModalMode("view");
    setSelectedOutlet(outlet);
    setModalOpen(true);
  };

  const handleDelete = (outlet: IOutlet) => {
    modal.confirm({
      title: "Xác nhận xóa",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn xóa cửa hàng "${outlet.name}"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const result = await deleteOutlet(outlet.id);
          if (result.ok) {
            message.success("Xóa cửa hàng thành công!");
            fetchData();
          } else {
            message.error("Xóa cửa hàng thất bại!");
          }
        } catch (error) {
          message.error("Lỗi khi xóa cửa hàng!");
        }
      },
    });
  };

  const handleModalSubmit = async (values: Omit<IOutlet, "id">) => {
    try {
      if (modalMode === "create") {
        const result = await createOutlet(values);
        if (result.ok) {
          message.success("Tạo cửa hàng thành công!");
          setModalOpen(false);
          fetchData();
        }
      } else if (modalMode === "edit" && selectedOutlet) {
        const result = await updateOutlet(selectedOutlet.id, values);
        if (result.ok) {
          message.success("Cập nhật cửa hàng thành công!");
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (error) {
      message.error(
        `Lỗi khi ${modalMode === "create" ? "tạo" : "cập nhật"} cửa hàng!`
      );
    }
  };

  const columns: ColumnsType<IOutlet> = [
    {
      title: "Tên cửa hàng",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      filterSearch: true,
      width: 200,
      ellipsis: true,
      render: (text: string) => <span className="truncate">{text}</span>,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      render: (text: string) => <span className="truncate">{text}</span>,
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      render: (_: any, record: IOutlet) => (
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
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <h2 className="text-2xl font-bold">Quản lý cửa hàng</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm cửa hàng..."
            allowClear
            className="w-64"
            onChange={(e) => {
              const value = e.target.value
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
              if (!value) {
                fetchData();
              } else {
                setOutlets((prev) =>
                  prev.filter(
                    (outlet) =>
                      outlet.name
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .includes(value) ||
                      outlet.address
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .includes(value)
                  )
                );
              }
            }}
          />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm cửa hàng
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={outlets}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: pageSize,
          pageSizeOptions: [5, 10, 20, 50],
          defaultPageSize: pageSize,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `Hiển thị ${range[0]}-${range[1]} trên tổng ${total} cửa hàng`,
          onChange: (_, size) => setPageSize(size || 10),
        }}
        bordered
        scroll={{ y: "calc(100vh - 280px)", x: 800 }}
      />
      <OutletModal
        open={modalOpen}
        mode={modalMode}
        outlet={selectedOutlet}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
      {contextHolder}
    </div>
  );
}
