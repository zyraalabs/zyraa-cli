import { spawnSync } from "child_process";

export function gitCommit(prompt: string, cwd: string): void {
  try {
    spawnSync("git", ["add", "-A"], { cwd });
    spawnSync("git", ["commit", "-m", `zyraa: ${prompt}`], { cwd });
  } catch {}
}

export function gitRevert(cwd: string): void {
  try {
    spawnSync("git", ["reset", "--hard", "HEAD~1"], { cwd });
  } catch {}
}
