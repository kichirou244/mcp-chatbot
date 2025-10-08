const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function askAi(
  model: string = "gemini-2.5-flash",
  aiAgent: string = "gemini",
  question: string
) {
  try {
    const response = await fetch(`${BASE_URL}/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, aiAgent, question }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error asking AI:", error);
    throw error;
  }
}
