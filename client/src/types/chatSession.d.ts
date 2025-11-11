export interface IChatSession {
  id: number;
  sessionId: string;
  userId: number | null;
  startDate: string;
  endDate: string | null;
  totalTokens: number;
  status: "ACTIVE" | "ENDED";
  messageCount?: number;
  orderCount?: number;
  userName?: string;
  user?: {
    id: number;
    username: string;
    name: string;
    phone: string;
    address: string;
  };
}

export interface IChatMessage {
  id: number;
  sessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  toolUsed: string | null;
  tokensUsed: number;
  createdAt: string;
}