export interface AiResponse {
  text: string;
  tokensUsed: number;
}

class AiAgent {
  async ask(model: string, question: string): Promise<AiResponse> {
    throw new Error("Method 'ask()' must be implemented.");
  }
}

export default AiAgent;