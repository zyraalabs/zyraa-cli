import { saveToken, showConfigStatus } from "../lib/config.js";
import { terminal } from "../lib/terminal.js";
import { validateToken } from "../lib/configValidator.js";
import { ZodError } from "zod";

export function handleConfigCommand(args: string[]): void {
  if (args.includes("--status") || args.includes("-s")) {
    showConfigStatus();
    return;
  }

  const token = args[0];

  if (!token) {
    terminal.error("No token provided");
    terminal.newLine();
    terminal.usage(
      "zyraa config <token>",
      "Configure CLI with your authentication token"
    );
    terminal.newLine();
    terminal.dim("Get your token from: https://zyra.dev/dashboard");
    terminal.newLine();
    process.exit(1);
  }

  try {
    validateToken(token);
    saveToken(token);
  } catch (error) {
    if (error instanceof ZodError) {
      terminal.error("Invalid token format", undefined, error);
      terminal.dim(error.issues[0].message);
    } else {
      terminal.error("Failed to save configuration", undefined, error);
      terminal.dim(error instanceof Error ? error.message : "Unknown error");
    }
    terminal.newLine();
    process.exit(1);
  }
}
