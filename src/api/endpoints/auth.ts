import axiosInstance from "../../lib/axiosInstance.js";
import { requestHandler } from "../../lib/requesthandler.js";

interface LoginInitResponse {
  success: boolean;
  data: {
    requestId: string;
    url: string;
    expiresIn: number;
  };
  error?: string;
}

interface LoginStatusResponse {
  success: boolean;
  data: {
    status: "pending" | "approved" | "expired";
    token?: string;
  };
  error?: string;
}

export const authApi = {
  initLogin: requestHandler(() =>
    axiosInstance.post<LoginInitResponse>("/api/cli/login/init")
  ),

  checkStatus: requestHandler((requestId?: string) =>
    axiosInstance.get<LoginStatusResponse>(
      `/api/cli/login/status?req=${requestId}`
    )
  ),
};
