import AiAgent from "./aiAgent";
import GeminiAgent from "./geminiAgent";

export class AiAgentFactory {
  static create(name: string): AiAgent {
    if (name === "gemini") return new GeminiAgent();

    return new AiAgent();
  }
}
