import axiosInstance from "../../lib/axiosInstance.js";

interface RepromptSelectRequest {
  generationId: string;
  prompt: string;
  indexContent: string;
}

export async function callRepromptSelect(params: RepromptSelectRequest): Promise<string[]> {
  const response = await axiosInstance
    .post<{ success: boolean; data: { filePaths: string[] } }>("/api/reprompt/select", params)
    .catch((err) => {
      const status = err?.response?.status;
      const message = err?.response?.data?.error ?? err.message;
      if (status === 401 || status === 403) throw new Error(message);
      throw err;
    });
  return response.data.data.filePaths;
}
