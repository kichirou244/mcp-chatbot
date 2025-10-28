import AiAgent, { AiResponse } from "./aiAgent";
import "dotenv/config";

import { GoogleGenAI } from "@google/genai";
const apiKey = process.env.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey: apiKey });

class GeminiAgent extends AiAgent {
  async ask(model: string, question: string): Promise<AiResponse> {
    try {
      const response = await client.models.generateContent({
        model: model,
        contents: question,
      });

      const tokensUsed = 
        (response.usageMetadata?.thoughtsTokenCount || 0) +
        (response.usageMetadata?.candidatesTokenCount || 0);

      return {
        text: response.text as string,
        tokensUsed: tokensUsed,
      };
    } catch (error) {
      return {
        text: error as string,
        tokensUsed: 0,
      };
    }
  }
}
export default GeminiAgent;
