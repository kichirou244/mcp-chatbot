import { Modal, Form, Input, InputNumber, Select, message } from "antd";
import { useEffect } from "react";
import type { IProduct, IProductCreate } from "@/types/Product";
import type { IOutlet } from "@/types/Outlet";

interface ProductModalProps {
  open: boolean;
  mode: "create" | "edit" | "view";
  product: IProduct | null;
  outlets: IOutlet[];
  onCancel: () => void;
  onSubmit: (values: IProductCreate) => Promise<void>;
}

const ProductModal = ({
  open,
  mode,
  product,
  outlets,
  onCancel,
  onSubmit,
}: ProductModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && product) {
      form.setFieldsValue(product);
    } else {
      form.resetFields();
    }
  }, [open, product, form]);

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
        return "Thêm sản phẩm mới";
      case "edit":
        return "Chỉnh sửa sản phẩm";
      case "view":
        return "Chi tiết sản phẩm";
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
          label="Tên sản phẩm"
          rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm!" }]}
        >
          <Input placeholder="Nhập tên sản phẩm" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
        >
          <Input.TextArea
            placeholder="Nhập mô tả sản phẩm"
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <div className="grid grid-cols-3 gap-4">
          <Form.Item
            name="outletId"
            label="Cửa hàng"
            rules={[{ required: true, message: "Vui lòng chọn cửa hàng!" }]}
          >
            <Select
              placeholder="Chọn cửa hàng"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={outlets.map((outlet) => ({
                value: outlet.id,
                label: outlet.name,
              }))}
            />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Giá (VNĐ)"
            rules={[
              { required: true, message: "Vui lòng nhập giá!" },
              { type: "number", min: 0, message: "Giá phải lớn hơn 0!" },
            ]}
          >
            <InputNumber
              placeholder="Nhập giá"
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng!" },
              {
                type: "number",
                min: 0,
                message: "Số lượng phải lớn hơn hoặc bằng 0!",
              },
            ]}
          >
            <InputNumber
              placeholder="Nhập số lượng"
              className="w-full"
              min={0}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default ProductModal;
