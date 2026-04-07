// Use the same port the page was served from (server serves frontend too)
const API_BASE = "";

/**
 * Send a staged pipeline request and stream SSE events back.
 *
 * requestBody: { message, model, stage, context }
 * handlers:
 *   onFeedItem(item)
 *   onTaskUpdate(patch)
 *   onApproveGate(gate)       — { type: "copy"|"scenario", ... }
 *   onAgentActivity(activity)
 *   onStoryboardImage(data)   — { scene, imageBase64 }
 *   onDone()
 *   onError(message)
 */
export async function startChat(requestBody, handlers = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
  } catch (err) {
    handlers.onError?.(`네트워크 오류: ${err.message}`);
    return;
  }

  if (!response.ok) {
    handlers.onError?.(`서버 오류: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";

      for (const chunk of chunks) {
        const lines = chunk.trim().split("\n");
        let eventType = "message";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) eventType = line.slice(7).trim();
          if (line.startsWith("data: ")) dataStr = line.slice(6);
        }

        if (!dataStr) continue;

        let data;
        try { data = JSON.parse(dataStr); } catch { continue; }

        if (eventType === "feed_item")        handlers.onFeedItem?.(data);
        else if (eventType === "task_update") handlers.onTaskUpdate?.(data);
        else if (eventType === "approve_gate") handlers.onApproveGate?.(data);
        else if (eventType === "agent_activity") handlers.onAgentActivity?.(data);
        else if (eventType === "storyboard_image") handlers.onStoryboardImage?.(data);
        else if (eventType === "text_chunk")  handlers.onTextChunk?.(data);
        else if (eventType === "done")        handlers.onDone?.(data);
        else if (eventType === "error")       handlers.onError?.(data.message ?? "알 수 없는 오류");
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      handlers.onError?.(`스트림 오류: ${err.message}`);
    }
  }
}
