import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import type { ParsedFile } from "./parser.js";

export interface WriteResult {
  created: string[];
  failed: { path: string; error: string }[];
}

export function writeFiles(
  files: ParsedFile[],
  targetDir: string
): WriteResult {
  const created: string[] = [];
  const failed: { path: string; error: string }[] = [];
  const absoluteTarget = resolve(targetDir);

  for (const file of files) {
    try {
      const fullPath = resolve(absoluteTarget, file.path);

      if (!fullPath.startsWith(absoluteTarget)) {
        failed.push({
          path: file.path,
          error: "Path traversal detected — skipping",
        });
        continue;
      }

      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, file.content, "utf-8");
      created.push(file.path);
    } catch (error) {
      const err = error as Error;
      failed.push({
        path: file.path,
        error: err.message || "Unknown write error",
      });
    }
  }

  return { created, failed };
}
