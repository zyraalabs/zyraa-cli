import { spawn } from "child_process";

export interface BuildError {
  description: string;
  location?: string;
}

export interface BuildResult {
  clean: boolean;
  errors: string;
  parsed: BuildError[];
}

export function parseErrors(output: string): BuildError[] {
  const results: BuildError[] = [];
  const seen = new Set<string>();
  const lines = output.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const tsMatch = line.match(/^(.+)\((\d+,\d+)\):\s+error TS\d+:\s+(.+)/);
    if (tsMatch) {
      const description = tsMatch[3].trim();
      const location = `${tsMatch[1]}:${tsMatch[2]}`;
      if (!seen.has(description)) {
        seen.add(description);
        results.push({ description, location });
      }
      continue;
    }

    const nextTypeError = line.match(/^Type error:\s+(.+)/);
    if (nextTypeError) {
      const description = nextTypeError[1].trim();
      if (!seen.has(description)) {
        seen.add(description);
        const prevLine = lines[i - 1]?.trim();
        results.push({ description, location: prevLine || undefined });
      }
      continue;
    }

    const moduleError = line.match(/Module not found:\s+(.+)/);
    if (moduleError) {
      const description = moduleError[1].trim();
      if (!seen.has(description)) {
        seen.add(description);
        results.push({ description });
      }
      continue;
    }
  }

  return results.slice(0, 8);
}

export function runBuild(cwd: string): Promise<BuildResult> {
  return new Promise((resolve) => {
    const child = spawn("pnpm", ["build"], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    const chunks: string[] = [];
    const collect = (data: Buffer) => chunks.push(data.toString());

    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);

    child.on("close", (code) => {
      const output = chunks.join("").trim();
      if (code === 0) {
        resolve({ clean: true, errors: "", parsed: [] });
      } else {
        resolve({ clean: false, errors: output, parsed: parseErrors(output) });
      }
    });

    child.on("error", (err) => {
      resolve({ clean: false, errors: err.message, parsed: [{ description: err.message }] });
    });
  });
}
