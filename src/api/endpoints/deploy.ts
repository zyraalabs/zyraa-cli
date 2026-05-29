import { existsSync, readFileSync } from "fs";
import { join } from "path";
import axiosInstance from "../../lib/axiosInstance.js";

export interface DeployResult {
  url: string;
  vercelProjectId: string;
}

function readEnvLocal(projectDir: string): Record<string, string> {
  const envPath = join(projectDir, ".env.local");
  if (!existsSync(envPath)) return {};

  const vars: Record<string, string> = {};
  for (const raw of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();
    if (key && value) vars[key] = value;
  }
  return vars;
}

export async function deployProject(
  generationId: string,
  zip: Buffer,
  vercelProjectId?: string,
): Promise<DeployResult> {
  const params = new URLSearchParams({ generationId });
  if (vercelProjectId) params.set("vercelProjectId", vercelProjectId);

  const envVars = readEnvLocal(process.cwd());
  const envHeader = Buffer.from(JSON.stringify(envVars)).toString("base64");

  const { data } = await axiosInstance.post<DeployResult>(
    `/api/deploy?${params.toString()}`,
    zip,
    {
      headers: {
        "Content-Type": "application/zip",
        "x-env-vars": envHeader,
      },
      maxBodyLength: 20 * 1024 * 1024,
      maxContentLength: 20 * 1024 * 1024,
    },
  );
  return data;
}
