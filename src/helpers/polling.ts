import { authApi } from "../api/endpoints/auth.js";

export function pollForApproval(requestId: string, expiresIn: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const endTime = Date.now() + expiresIn * 1000;

    const check = async () => {
      if (Date.now() >= endTime) {
        reject(new Error("Login request timed out"));
        return;
      }

      const result = await authApi.checkStatus(requestId);

      if (result.code === "success") {
        const { data } = result;
        if (data.success && data.data.status === "approved") {
          resolve(data.data.token!);
          return;
        }
        if (!data.success && data.error?.includes("expired")) {
          reject(new Error("Login request expired"));
          return;
        }
      }

      setTimeout(check, 2000);
    };

    check();
  });
}
