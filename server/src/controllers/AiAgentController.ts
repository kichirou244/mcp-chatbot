import { Request, Response } from "express";
import { AiAgentFactory } from "../aiAgents/aiAgentFactory";

export const askAi = async (req: Request, res: Response) => {
  try {
    const { aiAgent, model, question } = req.body;

    const agent = AiAgentFactory.create(aiAgent);

    const response = await agent.ask(model, question);

    res.status(200).json({ response });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
