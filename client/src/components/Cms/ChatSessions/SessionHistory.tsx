import { useEffect, useState } from "react";
import {
  getSessionStats,
  type IChatSession,
} from "@/actions/chatSession.actions";
import SessionHistoryModal from "./SessionHistoryModal";
import { Table, Tag, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";

export default function SessionHistory() {
  const [sessions, setSessions] = useState<IChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const result = await getSessionStats();
      if (result.ok) {
        setSessions(result.data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const calculateDuration = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    const minutes = Math.floor((end - start) / 60000);
    return minutes > 0 ? `${minutes} phút` : "< 1 phút";
  };

  const columns: ColumnsType<IChatSession> = [
    {
      title: "Session ID",
      dataIndex: "sessionId",
      key: "sessionId",
      width: 200,
      render: (text: string) => (
        <p className="font-mono text-xs truncate">{text}</p>
      ),
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      width: 100,
      render: (text: string | null) =>
        text || <p className="text-gray-400 truncate">Guest</p>,
    },
    {
      title: "Bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      width: 180,
      render: (date: string) => formatDate(date),
    },
    {
      title: "Kết thúc",
      dataIndex: "endDate",
      key: "endDate",
      width: 180,
      render: (date: string | null) =>
        date ? formatDate(date) : <span className="text-gray-400">-</span>,
    },
    {
      title: "Thời lượng",
      key: "duration",
      width: 120,
      render: (_, record) =>
        calculateDuration(record.startDate, record.endDate),
    },
    {
      title: "Tin nhắn",
      dataIndex: "messageCount",
      key: "messageCount",
      width: 100,
      align: "center",
      render: (count: number) => <Tag color="blue">{count || 0}</Tag>,
    },
    {
      title: "Đơn hàng",
      dataIndex: "orderCount",
      key: "orderCount",
      width: 100,
      align: "center",
      render: (count: number) =>
        count ? (
          <Tag color="green">{count}</Tag>
        ) : (
          <span className="text-gray-400">0</span>
        ),
    },
    {
      title: "Tokens",
      dataIndex: "totalTokens",
      key: "totalTokens",
      width: 100,
      align: "right",
      render: (tokens: number) => tokens.toLocaleString(),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewHistory(record.sessionId)}
        ></Button>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-2xl font-bold">
          Quản lý và theo dõi các phiên chat với khách hàng
        </h2>
      </div>

      <Table
        columns={columns}
        dataSource={sessions}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} sessions`,
        }}
        bordered
        scroll={{ y: "calc(100vh - 280px)", x: 1200 }}
      />

      {selectedSessionId && (
        <SessionHistoryModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}
