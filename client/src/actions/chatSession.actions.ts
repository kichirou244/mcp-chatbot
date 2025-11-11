import type { IChatMessage, IChatSession } from "@/types/chatSession";
import type { IResponse } from "@/types/Global";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function createChatSession(
  sessionId: string,
  userId: number | null = null
): Promise<IResponse<IChatSession>> {
  const response = await fetch(`${BASE_URL}/chat-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sessionId, userId }),
  });
  
  const data = await response.json();
  return data;
}

export async function addChatMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  toolUsed: string | null = null,
  tokensUsed: number = 0
): Promise<IResponse<IChatMessage>> {
  const response = await fetch(
    `${BASE_URL}/chat-session/${sessionId}/message`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role, content, toolUsed, tokensUsed }),
    }
  );

  const data = await response.json();
  return data;
}

export async function getSessionHistory(
  sessionId: string
): Promise<IResponse<any>> {
  const response = await fetch(
    `${BASE_URL}/chat-session/${sessionId}/history`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  return data;
}

export async function getSessionStats(): Promise<IResponse<IChatSession[]>> {
  const response = await fetch(`${BASE_URL}/chat-session/stats`);

  const data = await response.json();
  return data;
}

export async function endSession(sessionId: string): Promise<IResponse<void>> {
  const response = await fetch(`${BASE_URL}/chat-session/${sessionId}/end`, {
    method: "PUT",
  });

  const data = await response.json();
  return data;
}
