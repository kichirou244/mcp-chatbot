class AiAgent {
  async ask(model: string, question: string): Promise<string> {
    throw new Error("Method 'ask()' must be implemented.");
  }
}

export default AiAgent;
