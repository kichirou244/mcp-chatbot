import { Modal, Form, Input, message } from "antd";
import { useEffect } from "react";
import type { IOutlet } from "@/types/Outlet";

interface OutletModalProps {
  open: boolean;
  mode: "create" | "edit" | "view";
  outlet: IOutlet | null;
  onCancel: () => void;
  onSubmit: (values: Omit<IOutlet, "id">) => Promise<void>;
}

const OutletModal = ({
  open,
  mode,
  outlet,
  onCancel,
  onSubmit,
}: OutletModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && outlet) {
      form.setFieldsValue(outlet);
    } else {
      form.resetFields();
    }
  }, [open, outlet, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      message.error("Vui lòng kiểm tra lại thông tin!");
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Thêm cửa hàng mới";
      case "edit":
        return "Chỉnh sửa cửa hàng";
      case "view":
        return "Chi tiết cửa hàng";
      default:
        return "";
    }
  };

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
      width={600}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        disabled={mode === "view"}
        className="mt-4"
      >
        <Form.Item
          name="name"
          label="Tên cửa hàng"
          rules={[{ required: true, message: "Vui lòng nhập tên cửa hàng!" }]}
        >
          <Input placeholder="Nhập tên cửa hàng" />
        </Form.Item>

        <Form.Item
          name="address"
          label="Địa chỉ"
          rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
        >
          <Input.TextArea
            placeholder="Nhập địa chỉ cửa hàng"
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OutletModal;
