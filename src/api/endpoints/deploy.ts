import axiosInstance from "../../lib/axiosInstance.js";

export interface DeployResult {
  url: string;
  netlifyId: string;
}

export async function deployProject(
  generationId: string,
  zip: Buffer,
  netlifyId?: string,
): Promise<DeployResult> {
  const params = new URLSearchParams({ generationId });
  if (netlifyId) params.set("netlifyId", netlifyId);

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
