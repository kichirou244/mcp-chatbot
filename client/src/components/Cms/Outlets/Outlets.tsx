import { useState } from "react";
import { Table, Button, Space, Modal } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { IOutlet } from "../../../types/Outlet";
import {
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
import { useNotification } from "../../../contexts/NotificationContext";

interface OutletsProps {
  outlets: IOutlet[];
  loading: boolean;
  onRefresh: () => void;
}

export default function Outlets({ outlets, loading, onRefresh }: OutletsProps) {
  const [modal, contextHolder] = Modal.useModal();
  const showNotification = useNotification();
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [selectedOutlet, setSelectedOutlet] = useState<IOutlet | null>(null);

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
            showNotification("Xóa cửa hàng thành công!", "success");
            onRefresh();
          } else {
            showNotification("Xóa cửa hàng thất bại!", "error");
          }
        } catch (error) {
          showNotification("Lỗi khi xóa cửa hàng!", "error");
        }
      },
    });
  };

  const handleModalSubmit = async (values: Omit<IOutlet, "id">) => {
    try {
      if (modalMode === "create") {
        const result = await createOutlet(values);
        if (result.ok) {
          showNotification("Tạo cửa hàng thành công!", "success");
          setModalOpen(false);
          onRefresh();
        }
      } else if (modalMode === "edit" && selectedOutlet) {
        const result = await updateOutlet(selectedOutlet.id, values);
        if (result.ok) {
          showNotification("Cập nhật cửa hàng thành công!", "success");
          setModalOpen(false);
          onRefresh();
        }
      }
    } catch (error) {
      showNotification(
        `Lỗi khi ${modalMode === "create" ? "tạo" : "cập nhật"} cửa hàng!`,
        "error"
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
      width: 300,
      ellipsis: true,
      render: (text: string) => <span className="truncate">{text}</span>,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      width: 300,
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
    <div className="bg-white p-6 shadow h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <h2 className="text-2xl font-bold">Quản lý cửa hàng</h2>
        <div className="flex items-center gap-2">
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
