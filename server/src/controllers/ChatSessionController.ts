import { Request, Response } from "express";
import { ChatSessionService } from "../services/ChatSessionService";

const chatSessionService = new ChatSessionService();

export class ChatSessionController {
  static async createSession(req: Request, res: Response) {
    try {
      const { sessionId, userId } = req.body;

      const session = await chatSessionService.createSession(
        userId || null,
        sessionId
      );

      res.status(201).json({
        ok: true,
        data: session,
      });
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        message: error.message,
      });
    }
  }

  static async addMessage(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { role, content, toolUsed, tokensUsed } = req.body;

      const message = await chatSessionService.addMessageBySessionId(
        sessionId,
        role,
        content,
        toolUsed || null,
        tokensUsed || 0
      );

      res.status(201).json({
        ok: true,
        data: message,
      });
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        message: error.message,
      });
    }
  }

  static async getSessionHistory(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      const history = await chatSessionService.getSessionHistoryBySessionId(
        sessionId
      );

      res.status(200).json({
        ok: true,
        data: history,
      });
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        message: error.message,
      });
    }
  }

  static async getSessionStats(req: Request, res: Response) {
    try {
      const stats = await chatSessionService.getSessionStats();

      res.status(200).json({
        ok: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        message: error.message,
      });
    }
  }

  static async endSession(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;

      await chatSessionService.endSessionBySessionId(sessionId);

      res.status(200).json({
        ok: true,
        message: "Session ended successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        ok: false,
        message: error.message,
      });
    }
  }
}
