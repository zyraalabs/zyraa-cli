import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { terminal } from "./terminal.js";

const CONFIG_FILE = join(homedir(), ".zyra", "config");

export function getAuthToken(): string {
  if (!existsSync(CONFIG_FILE)) {
    terminal.error("Not authenticated");
    terminal.newLine();
    terminal.dim("Run 'zyraa login' to authenticate first");
    terminal.newLine();
    process.exit(1);
  }

  const token = readFileSync(CONFIG_FILE, "utf-8").trim();

  if (!token) {
    terminal.error("Authentication token is empty");
    terminal.newLine();
    terminal.dim("Run 'zyraa login' to re-authenticate");
    terminal.newLine();
    process.exit(1);
  }

  return token;
}
