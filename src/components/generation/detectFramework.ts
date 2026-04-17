import { detectFrameworkApi } from "../../api/endpoints/detectFramework.js";
import { IS_MOCK, MOCK_DETECTION } from "../../lib/mock.js";

export interface DetectionResult {
  framework: string;
  reasoning: string;
  needsScaffold: boolean;
  scaffoldCommand: string;
}

export async function detectFramework(prompt: string): Promise<DetectionResult> {
  if (IS_MOCK) return MOCK_DETECTION;

  const result = await detectFrameworkApi.detect({ prompt });

  if (result.code === "error" || !result.data.success) {
    return { framework: "nextjs", reasoning: "Full-stack React framework", needsScaffold: false, scaffoldCommand: "" };
  }

  return result.data.data as DetectionResult;
}
