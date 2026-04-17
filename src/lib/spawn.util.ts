import { spawn } from "child_process";

interface SpawnOptions {
  cwd: string;
  onOutput?: (line: string) => void;
}

export function runCommand(
  command: string,
  args: string[],
  options: SpawnOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const isShellCommand = args.length === 0 || command.includes("&&") || command.includes("||");

    const child = isShellCommand
      ? spawn(command, { cwd: options.cwd, stdio: ["ignore", "pipe", "pipe"], shell: true })
      : spawn(command, args, { cwd: options.cwd, stdio: ["ignore", "pipe", "pipe"], shell: true });

    if (options.onOutput) {
      const handle = (data: Buffer) => {
        const line = data.toString().trim();
        if (line) options.onOutput!(line);
      };
      child.stdout?.on("data", handle);
      child.stderr?.on("data", handle);
    } else {
      child.stdout?.resume();
      child.stderr?.resume();
    }

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}`));
    });

    child.on("error", (err) => reject(new Error(`Failed to run command: ${err.message}`)));
  });
}

export function runCommandDetached(command: string, args: string[], cwd: string): void {
  const child = spawn(command, args, {
    cwd,
    stdio: "ignore",
    detached: true,
    shell: true,
  });
  child.unref();
}
