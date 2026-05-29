import axiosInstance from "../../lib/axiosInstance.js";

export interface DeployResult {
  url: string;
  vercelProjectId: string;
}

export async function deployProject(
  generationId: string,
  zip: Buffer,
  vercelProjectId?: string,
): Promise<DeployResult> {
  const params = new URLSearchParams({ generationId });
  if (vercelProjectId) params.set("vercelProjectId", vercelProjectId);

  const { data } = await axiosInstance.post<DeployResult>(
    `/api/deploy?${params.toString()}`,
    zip,
    {
      headers: { "Content-Type": "application/zip" },
      maxBodyLength: 20 * 1024 * 1024,
      maxContentLength: 20 * 1024 * 1024,
    },
  );
  return data;
}
