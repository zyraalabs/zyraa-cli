import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { join, relative } from "path";

export interface FileEntry {
  path: string;
  content: string;
}

export interface ProjectIndex {
  indexContent: string;
  hasIndex: boolean;
}

export function readProjectIndex(cwd: string): ProjectIndex {
  const indexPath = join(cwd, ".zyraa", "index.md");
  if (existsSync(indexPath)) {
    return { indexContent: readFileSync(indexPath, "utf-8"), hasIndex: true };
  }

  const srcDir = join(cwd, "src");
  if (!existsSync(srcDir)) {
    return { indexContent: "", hasIndex: false };
  }

  const files = collectFiles(srcDir, cwd);
  for (const name of ["package.json", "tsconfig.json", "next.config.ts"]) {
    const full = join(cwd, name);
    if (existsSync(full)) files.push(name);
  }

  return {
    indexContent: "# Project Files\n\n" + files.map((f) => `- ${f}`).join("\n"),
    hasIndex: false,
  };
}

function collectFiles(dir: string, cwd: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry !== "node_modules" && entry !== ".next") {
        result.push(...collectFiles(full, cwd));
      }
    } else if (/\.(ts|tsx|js|jsx|css|json)$/.test(entry)) {
      result.push(relative(cwd, full));
    }
  }
  return result;
}

export function readFiles(filePaths: string[], cwd: string): FileEntry[] {
  return filePaths
    .filter((p) => existsSync(join(cwd, p)))
    .map((p) => ({ path: p, content: readFileSync(join(cwd, p), "utf-8") }));
}

export function hasZyraaIndex(cwd: string): boolean {
  return existsSync(join(cwd, ".zyraa", "index.md"));
}

export function readZyraaMeta(
  cwd: string,
): { generationId: string; framework: string } | null {
  const metaPath = join(cwd, ".zyraa", "meta.json");
  if (!existsSync(metaPath)) return null;
  try {
    return JSON.parse(readFileSync(metaPath, "utf-8"));
  } catch {
    return null;
  }
}

export function writeZyraaIndex(cwd: string, filePaths: string[]): void {
  const dir = join(cwd, ".zyraa");
  mkdirSync(dir, { recursive: true });
  const content =
    "# Project Index\n\n" + filePaths.map((p) => `- ${p}`).join("\n");
  writeFileSync(join(dir, "index.md"), content);
}

export function refreshZyraaIndex(cwd: string): void {
  const files: string[] = [];
  const srcDir = join(cwd, "src");
  if (existsSync(srcDir)) files.push(...collectFiles(srcDir, cwd));
  for (const name of ["package.json", "tsconfig.json", "next.config.ts", "next.config.js"]) {
    if (existsSync(join(cwd, name))) files.push(name);
  }
  if (files.length > 0) writeZyraaIndex(cwd, files);
}

export function writeZyraaMeta(
  cwd: string,
  generationId: string,
  framework: string,
): void {
  const dir = join(cwd, ".zyraa");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "meta.json"),
    JSON.stringify({ generationId, framework }, null, 2),
  );
}
