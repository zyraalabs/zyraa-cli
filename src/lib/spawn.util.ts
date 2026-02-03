import { spawn, ChildProcess } from "child_process";
import { terminal } from "./terminal.js";

interface SpawnOptions {
  cwd: string;
  onOutput?: (line: string) => void;
  inheritStdio?: boolean;
}

export function runCommand(
  command: string,
  args: string[],
  options: SpawnOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: options.inheritStdio ? "inherit" : ["ignore", "pipe", "pipe"],
      shell: true,
    });

    if (!options.inheritStdio) {
      const handleData = (data: Buffer) => {
        const line = data.toString().trim();
        if (line) {
          options.onOutput?.(line) ?? terminal.dim(`  ${line}`);
        }
      };

      child.stdout?.on("data", handleData);
      child.stderr?.on("data", handleData);
    }

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else reject(new Error(`Command exited with code ${code}`));
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to run command: ${error.message}`));
    });
  });
}

export function runCommandDetached(
  command: string,
  args: string[],
  cwd: string,
): ChildProcess {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  const cleanup = () => {
    child.kill("SIGTERM");
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  return child;
}
