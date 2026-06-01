import axiosInstance from "../../lib/axiosInstance.js";
import type { ClarifyQuestion } from "../../lib/types.js";

export interface ClarifyResponse {
  needsClarification: boolean;
  questions: ClarifyQuestion[];
}

export interface ClarifyOptions {
  mode?: "generate" | "reprompt";
  framework?: string;
  zyraaMdContent?: string;
}

export async function callClarify(prompt: string, options: ClarifyOptions = {}): Promise<ClarifyResponse> {
  const response = await axiosInstance
    .post<{ success: boolean; data: ClarifyResponse }>("/api/clarify", { prompt, ...options })
    .catch((err) => {
      const status = err?.response?.status;
      const message = err?.response?.data?.error ?? err.message;
      if (status) throw new Error(message);
      throw err;
    });
  return response.data.data;
}
