import { mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import type { ParsedFile } from "./parser.js";

export interface WriteResult {
  created: string[];
  failed: { path: string; error: string }[];
}

/**
 // Input: file.path = "src/app/page.tsx"
// Current dir: /Users/you/project

// Step 1: Create full path
fullPath = resolve("/Users/you/project", "src/app/page.tsx")
// Result: "/Users/you/project/src/app/page.tsx"

// Step 2: Check security (starts with project dir? )

// Step 3: Create directory
mkdirSync("/Users/you/project/src/app", { recursive: true })

// Step 4: Write file
writeFileSync(
  "/Users/you/project/src/app/page.tsx",
  "export default function Home() {...}",
  "utf-8"
)
 */
export function writeFiles(
  files: ParsedFile[],
  targetDir: string,
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
