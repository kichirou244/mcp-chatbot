import "dotenv/config";

import { GoogleGenAI } from "@google/genai";
import { AppError } from "../utils/errors";
const apiKey = process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey: apiKey });

export class AiAgent {
  async ask(model: string, question: string): Promise<string> {
    try {
      const response = await client.models.generateContent({
        model: model,
        contents: question,
      });

      return response.text as string;
    } catch (error) {
      throw new AppError("Failed to call AI model", 500);
    }
  }
}
