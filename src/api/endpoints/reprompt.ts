import axiosInstance from "../../lib/axiosInstance.js";

interface RepromptRequest {
  generationId: string;
  prompt: string;
  files: Array<{ path: string; content: string }>;
  framework?: string;
}

export interface RepromptResult {
  output: string;
  usage: { inputTokens: number; outputTokens: number };
}

export async function streamReprompt(
  params: RepromptRequest,
  onChunk: (text: string) => void,
): Promise<RepromptResult> {
  const response = await axiosInstance
    .post("/api/reprompt", params, { responseType: "stream" })
    .catch((err) => {
      const status = err?.response?.status;
      const message = err?.response?.data?.error ?? err.message;
      if (status === 401 || status === 403) throw new Error(message);
      throw err;
    });

  return new Promise((resolve, reject) => {
    let fullText = "";
    let usage = { inputTokens: 0, outputTokens: 0 };
    let buffer = "";

    response.data.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6)) as {
            type: string;
            text?: string;
            usage?: typeof usage;
            message?: string;
          };
          if (event.type === "text" && event.text) {
            fullText += event.text;
            onChunk(event.text);
          } else if (event.type === "done" && event.usage) {
            usage = event.usage;
          } else if (event.type === "error") {
            reject(new Error(event.message ?? "Reprompt failed"));
          }
        } catch {
          // skip malformed lines
        }
      }
    });

    response.data.on("end", () => resolve({ output: fullText, usage }));
    response.data.on("error", (err: Error) => reject(err));
  });
}
