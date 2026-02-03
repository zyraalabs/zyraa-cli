import axiosInstance from "../../lib/axiosInstance.js";
import { requestHandler } from "../../lib/requesthandler.js";

interface GenerateRequest {
  prompt: string;
  framework?: string;
  wasScaffolded?: boolean;
}

interface GenerateResponseData {
  output: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

interface GenerateResponse {
  success: boolean;
  data: GenerateResponseData;
  error?: string;
}

export const generateApi = {
  generate: requestHandler<GenerateRequest, GenerateResponse>(
    (params?: GenerateRequest) =>
      axiosInstance.post<GenerateResponse>("/api/generate", {
        prompt: params?.prompt,
        framework: params?.framework,
        wasScaffolded: params?.wasScaffolded,
      })
  ),
};
