import axiosInstance from "../../lib/axiosInstance.js";
import { IS_MOCK, streamMockOutput } from "../../lib/mock.js";

interface GenerateRequest {
  prompt: string;
  framework?: string;
  wasScaffolded?: boolean;
}

export interface GenerateResult {
  output: string;
  usage: { inputTokens: number; outputTokens: number };
  generationId: string;
}

export async function streamGenerate(
  params: GenerateRequest,
  onChunk: (text: string) => void,
): Promise<GenerateResult> {
  if (IS_MOCK) return streamMockOutput(onChunk);

  const response = await axiosInstance.post("/api/generate", params, {
    responseType: "stream",
  }).catch((err) => {
    const status = err?.response?.status;
    const message = err?.response?.data?.error ?? err.message;
    if (status === 401 || status === 403 || status === 429) throw new Error(message);
    throw err;
  });

  return new Promise((resolve, reject) => {
    let fullText = "";
    let usage = { inputTokens: 0, outputTokens: 0 };
    let generationId = "";
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
            generationId?: string;
            message?: string;
          };
          if (event.type === "text" && event.text) {
            fullText += event.text;
            onChunk(event.text);
          } else if (event.type === "done") {
            if (event.usage) usage = event.usage;
            if (event.generationId) generationId = event.generationId;
          } else if (event.type === "error") {
            reject(new Error(event.message ?? "Generation failed"));
          }
        } catch {
          // skip malformed lines
        }
      }
    });

    response.data.on("end", () => resolve({ output: fullText, usage, generationId }));
    response.data.on("error", (err: Error) => reject(err));
  });
}
