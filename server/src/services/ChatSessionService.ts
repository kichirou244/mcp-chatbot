import { ChatSession, ChatMessage, SessionOrder } from "../models/ChatSession";
import { AppError } from "../utils/errors";

export class ChatSessionService {
  async createSession(
    userId: number | null,
    sessionId: string
  ): Promise<ChatSession> {
    try {
      const session = await ChatSession.create({
        userId,
        sessionId,
        startDate: new Date(),
        endDate: null,
        totalTokens: 0,
        status: "ACTIVE",
      });

      return session;
    } catch (error) {
      throw new AppError(`Error creating session: ${error}`, 500);
    }
  }

  async addMessageBySessionId(
    sessionId: string,
    role: "user" | "assistant" | "system",
    content: string,
    toolUsed: string | null,
    tokensUsed: number
  ): Promise<ChatMessage> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      const message = await ChatMessage.create({
        sessionId: session.id,
        role,
        content,
        toolUsed,
        tokensUsed,
        createdAt: new Date(),
      });

      await session.update({
        totalTokens: session.totalTokens + tokensUsed,
      });

      return message;
    } catch (error) {
      throw new AppError(`Error adding message: ${error}`, 500);
    }
  }

  async getSessionHistoryBySessionId(sessionId: string): Promise<{
    session: ChatSession;
    messages: ChatMessage[];
  }> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      const messages = await ChatMessage.findAll({
        where: { sessionId: session.id },
        order: [["createdAt", "ASC"]],
      });

      return {
        session,
        messages,
      };
    } catch (error) {
      throw new AppError(`Error fetching session history: ${error}`, 500);
    }
  }

  async endSessionBySessionId(sessionId: string): Promise<void> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      await session.update({
        endDate: new Date(),
        status: "ENDED",
      });
    } catch (error) {
      throw new AppError(`Error ending session: ${error}`, 500);
    }
  }

  async getSessionStats(): Promise<any[]> {
    try {
      const sessions = await ChatSession.findAll({
        attributes: [
          "id",
          "userId",
          "sessionId",
          "startDate",
          "endDate",
          "totalTokens",
          "status",
        ],
        include: [
          {
            association: "user",
            attributes: ["username"],
            required: false,
          },
        ],
        order: [["startDate", "DESC"]],
      });

      const statsPromises = sessions.map(async (session) => {
        const messageCount = await ChatMessage.count({
          where: { sessionId: session.id },
        });

        const orderCount = await SessionOrder.count({
          where: { sessionId: session.id },
        });

        return {
          id: session.id,
          sessionId: session.sessionId,
          userId: session.userId,
          startDate: session.startDate,
          endDate: session.endDate,
          totalTokens: session.totalTokens,
          status: session.status,
          messageCount,
          orderCount,
          userName: (session as any).user?.username || null,
        };
      });

      const stats = await Promise.all(statsPromises);
      return stats;
    } catch (error) {
      throw new AppError(`Error fetching session stats: ${error}`, 500);
    }
  }

  async linkOrderToSession(
    sessionId: string,
    orderId: number
  ): Promise<SessionOrder> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      const sessionOrder = await SessionOrder.create({
        sessionId: session.id,
        orderId,
        createdAt: new Date(),
      });

      return sessionOrder;
    } catch (error) {
      throw new AppError(`Error linking order to session: ${error}`, 500);
    }
  }

  async getOrdersBySessionId(sessionId: string): Promise<number[]> {
    try {
      const session = await ChatSession.findOne({
        where: { sessionId },
      });

      if (!session) {
        throw new AppError("Session not found", 404);
      }

      const sessionOrders = await SessionOrder.findAll({
        where: { sessionId: session.id },
        attributes: ["orderId"],
      });

      return sessionOrders.map((so) => so.orderId);
    } catch (error) {
      throw new AppError(`Error fetching orders for session: ${error}`, 500);
    }
  }
}
