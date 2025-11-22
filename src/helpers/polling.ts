import type { Ora } from "ora";
import { authApi } from "../api/endpoints/auth.js";

export const pollForApproval = (
  requestId: string,
  expiresIn: number,
  spinner: Ora
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const endTime = Date.now() + expiresIn * 1000;

    const checkStatus = async () => {
      if (Date.now() >= endTime) {
        spinner.fail("Login timed out");
        reject(new Error("No approval received within the time limit"));
        return;
      }

      const statusResult = await authApi.checkStatus(requestId);

      if (statusResult.code === "success") {
        const statusData = statusResult.data;

        if (statusData.success && statusData.data.status === "approved") {
          resolve(statusData.data.token!);
          return;
        }

        if (!statusData.success && statusData.error?.includes("expired")) {
          spinner.fail("Login request expired");
          reject(new Error("Login request expired"));
          return;
        }
      }

      setTimeout(checkStatus, 2000);
    };

    checkStatus();
  });
};
