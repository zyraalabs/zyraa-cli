import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { terminal } from "./terminal.js";

const CONFIG_DIR = join(homedir(), ".zyra");
const CONFIG_FILE = join(CONFIG_DIR, "config");

export function saveToken(token: string): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }

    writeFileSync(CONFIG_FILE, token);
    terminal.success("Token saved successfully");
  } catch (error) {
    terminal.error("Failed to save token", undefined, error);
    throw error;
  }
}

export function showConfigStatus(): void {
  terminal.header("Configuration Status");

  if (!existsSync(CONFIG_FILE)) {
    terminal.warn("No configuration found");
    terminal.newLine();
    terminal.dim("Run 'zyraa config <token>' to configure the CLI");
    terminal.newLine();
    return;
  }

  try {
    const token = readFileSync(CONFIG_FILE, "utf-8");
    terminal.success("Configuration found");
    terminal.newLine();
    terminal.label("Location", CONFIG_FILE);
    terminal.label("Token", `${token.substring(0, 20)}...`);
  } catch (error) {
    terminal.error("Failed to read configuration", undefined, error);
  }

  terminal.newLine();
}
