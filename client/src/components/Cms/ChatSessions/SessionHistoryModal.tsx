import { Modal, Table, Tag, Card, Descriptions, Timeline } from "antd";
import { useEffect, useState } from "react";
import {
  getSessionHistory,
  type IChatMessage,
  type IChatSession,
} from "@/actions/chatSession.actions";
import ReactMarkdown from "react-markdown";
import {
  UserOutlined,
  RobotOutlined,
  SettingOutlined,
} from "@ant-design/icons";

interface SessionHistoryModalProps {
  sessionId: string | null;
  onClose: () => void;
}

export default function SessionHistoryModal({
  sessionId,
  onClose,
}: SessionHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{
    session: IChatSession;
    messages: IChatMessage[];
    orders: any[];
  } | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchHistory();
    }
  }, [sessionId]);

  const fetchHistory = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const result = await getSessionHistory(sessionId.toString());
      if (result.ok) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "user":
        return <UserOutlined className="text-blue-500" />;
      case "assistant":
        return <RobotOutlined className="text-green-500" />;
      case "system":
        return <SettingOutlined className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "user":
        return "blue";
      case "assistant":
        return "green";
      case "system":
        return "default";
      default:
        return "default";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const orderColumns = [
    {
      title: "STT",
      key: "index",
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "orderId",
      key: "orderId",
      render: (text: string) => `#${text}`,
    },
    {
      title: "Ngày tạo",
      dataIndex: "date",
      key: "date",
      render: (date: string) => formatDate(date),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          PENDING: "orange",
          CONFIRMED: "blue",
          DELIVERED: "green",
          CANCELLED: "red",
        };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right" as const,
      render: (amount: number) => (
        <span className="font-semibold text-green-600">
          {amount?.toLocaleString("vi-VN")}đ
        </span>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div>
          <div className="text-lg font-bold">Chi tiết Chat Session</div>
          {history && (
            <div className="text-sm font-normal text-gray-500 mt-1">
              Session ID: {history.session.sessionId}
            </div>
          )}
        </div>
      }
      open={!!sessionId}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      maskClosable={false}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          padding: "16px",
        },
      }}
    >
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : history ? (
        <div className="space-y-4">
          <Card title="Thông tin Session" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Bắt đầu">
                {formatDate(history.session.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Kết thúc">
                {history.session.endDate ? (
                  formatDate(history.session.endDate)
                ) : (
                  <Tag color="green">Đang hoạt động</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tokens">
                {history.session.totalTokens.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag
                  color={
                    history.session.status === "ACTIVE" ? "green" : "default"
                  }
                >
                  {history.session.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Số tin nhắn">
                {history.messages.length}
              </Descriptions.Item>
              <Descriptions.Item label="Số đơn hàng">
                {history.orders?.length || 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {history.orders && history.orders.length > 0 && (
            <Card
              title={`Đơn hàng đã tạo (${history.orders.length})`}
              size="small"
            >
              <Table
                columns={orderColumns}
                dataSource={history.orders}
                pagination={false}
                rowKey="id"
                size="small"
                bordered
              />
            </Card>
          )}

          <Card
            title={`Lịch sử tin nhắn (${history.messages.length})`}
            size="small"
          >
            <Timeline
              items={history.messages.map((msg) => ({
                dot: getRoleIcon(msg.role),
                children: (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag color={getRoleColor(msg.role)}>
                        {msg.role.toUpperCase()}
                      </Tag>
                      <span className="text-xs text-gray-500">
                        {formatDate(msg.createdAt)}
                      </span>
                      {msg.tokensUsed > 0 && (
                        <Tag color="purple">{msg.tokensUsed} tokens</Tag>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-50"
                          : msg.role === "assistant"
                          ? "bg-green-50"
                          : "bg-gray-50"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">
                          {msg.content}
                        </div>
                      )}
                      {msg.toolUsed && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-600">
                            Tool used:{" "}
                            <Tag className="font-mono">{msg.toolUsed}</Tag>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Không tìm thấy dữ liệu
        </div>
      )}
    </Modal>
  );
}
