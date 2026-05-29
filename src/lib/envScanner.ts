import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

export interface EnvVar {
  key: string;
  hint: string;
  placeholder: string;
}

const PLACEHOLDER_PATTERNS = [
  /your[_-]/i,
  /[_-]here$/i,
  /[_-]example$/i,
  /placeholder/i,
  /changeme/i,
  /^xxx+$/i,
  /^<.+>$/,
  /^your$/i,
  /^todo$/i,
];

function isPlaceholder(key: string, value: string): boolean {
  if (value === "") return true;
  if (value.toUpperCase() === key) return true;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(value));
}

export function scanEnvVars(projectDir: string): EnvVar[] {
  const candidates = [
    ".env.example",
    ".env.local.example",
    ".env.sample",
    ".env.template",
    ".env.local",  // fallback: scan .env.local itself if it still contains placeholder values
  ];

  let filePath: string | null = null;
  for (const name of candidates) {
    const p = join(projectDir, name);
    if (existsSync(p)) { filePath = p; break; }
  }
  if (!filePath) return [];

  const lines = readFileSync(filePath, "utf-8").split(/\r?\n/);
  const result: EnvVar[] = [];
  let pendingHint = "";

  for (const raw of lines) {
    const line = raw.trim();

    if (line === "") { pendingHint = ""; continue; }

    if (line.startsWith("#")) {
      const comment = line.replace(/^#+\s*/, "").trim();
      if (comment) pendingHint = comment;
      continue;
    }

    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) { pendingHint = ""; continue; }

    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();

    if (!key || !/^[A-Z_][A-Z0-9_]*$/i.test(key)) { pendingHint = ""; continue; }

    if (isPlaceholder(key, value)) {
      result.push({ key, hint: pendingHint, placeholder: value });
    }

    pendingHint = "";
  }

  return result;
}

export function writeEnvFile(vars: Record<string, string>, projectDir: string): void {
  const entries = Object.entries(vars).filter(([, v]) => v.trim() !== "");
  if (entries.length === 0) return;

  const envPath = join(projectDir, ".env.local");
  const newValues = new Map(entries);

  if (existsSync(envPath)) {
    const raw = readFileSync(envPath, "utf-8");
    // Handle both LF and CRLF line endings
    const lines = raw.split(/\r?\n/);

    const output: string[] = [];
    const seenKeys = new Set<string>();

    for (const line of lines) {
      const eqIdx = line.indexOf("=");
      if (eqIdx !== -1) {
        const key = line.slice(0, eqIdx).trim();
        if (key && /^[A-Z_][A-Z0-9_]*$/i.test(key)) {
          // Skip duplicate keys — only keep the first occurrence
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);
          // Replace with user-provided value if available
          if (newValues.has(key)) {
            output.push(`${key}=${newValues.get(key)}`);
            continue;
          }
        }
      }
      output.push(line);
    }

    // Append keys the user provided that weren't already in the file
    for (const [k, v] of entries) {
      if (!seenKeys.has(k)) output.push(`${k}=${v}`);
    }

    // Normalize trailing whitespace: remove blank trailing lines, end with single newline
    while (output.length > 0 && output[output.length - 1].trim() === "") {
      output.pop();
    }

    writeFileSync(envPath, output.join("\n") + "\n", "utf-8");
  } else {
    writeFileSync(envPath, entries.map(([k, v]) => `${k}=${v}`).join("\n") + "\n", "utf-8");
  }
}
