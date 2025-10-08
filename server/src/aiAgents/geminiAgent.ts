import AiAgent from "./aiAgent";
import "dotenv/config";

import { GoogleGenAI } from "@google/genai";
const apiKey = process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey: apiKey });

class GeminiAgent extends AiAgent {
  async ask(model: string, question: string): Promise<string> {
    try {
      const response = await client.models.generateContent({
        model: model,
        contents: question,
      });

      return response.text as string;
    } catch (error) {
      return error as string;
    }
  }
}
export default GeminiAgent;
