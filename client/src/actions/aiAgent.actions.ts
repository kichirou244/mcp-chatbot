const BASE_URL = import.meta.env.VITE_BASE_URL;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProgressEvent {
  step: string;
  message: string;
  data?: any;
}

export async function chatWithAi(
  message: string, 
  chatHistory: ChatMessage[] = [],
  onProgress?: (progress: ProgressEvent) => void
) {
  const accessToken = localStorage.getItem("accessToken");
  
  // Use streaming if onProgress callback is provided
  const useStreaming = !!onProgress;
  
  if (useStreaming) {
    return chatWithAiStreaming(message, chatHistory, onProgress);
  }
  
  try {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken ? `Bearer ${accessToken}` : "",
      },
      body: JSON.stringify({ 
        message, 
        chatHistory,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error chatting with AI:", error);
    throw error;
  }
}

async function chatWithAiStreaming(
  message: string,
  chatHistory: ChatMessage[],
  onProgress: (progress: ProgressEvent) => void
) {
  const accessToken = localStorage.getItem("accessToken");
  
  return new Promise((resolve, reject) => {
    fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken ? `Bearer ${accessToken}` : "",
      },
      body: JSON.stringify({ 
        message, 
        chatHistory,
        stream: true
      }),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);
          
          if (eventMatch && dataMatch) {
            const event = eventMatch[1];
            const data = JSON.parse(dataMatch[1]);
            
            if (event === "progress") {
              onProgress(data as ProgressEvent);
            } else if (event === "complete") {
              resolve(data);
              return;
            } else if (event === "error") {
              reject(new Error(data.message || "Unknown error"));
              return;
            }
          }
        }
      }
    }).catch(reject);
  });
}

