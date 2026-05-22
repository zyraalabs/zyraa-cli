import axiosInstance from "../../lib/axiosInstance.js";

export interface DeployResult {
  url: string;
}

export async function deployProject(
  generationId: string,
  zip: Buffer,
): Promise<DeployResult> {
  const { data } = await axiosInstance.post<DeployResult>(
    `/api/deploy?generationId=${encodeURIComponent(generationId)}`,
    zip,
    {
      headers: { "Content-Type": "application/zip" },
      maxBodyLength: 20 * 1024 * 1024,
      maxContentLength: 20 * 1024 * 1024,
    },
  );
  return data;
}
