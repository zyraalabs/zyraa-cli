import axiosInstance from "../../lib/axiosInstance.js";
import { requestHandler } from "../../lib/requesthandler.js";

interface DetectFrameworkRequest {
  prompt: string;
}

interface DetectFrameworkResponseData {
  framework: string;
  reasoning: string;
  scaffoldCommand: string;
  needsScaffold: boolean;
}

interface DetectFrameworkResponse {
  success: boolean;
  data: DetectFrameworkResponseData;
  error?: string;
}

export const detectFrameworkApi = {
  detect: requestHandler<DetectFrameworkRequest, DetectFrameworkResponse>(
    (params?: DetectFrameworkRequest) =>
      axiosInstance.post<DetectFrameworkResponse>("/api/detect-framework", {
        prompt: params?.prompt,
      })
  ),
};
