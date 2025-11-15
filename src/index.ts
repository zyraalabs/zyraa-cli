#!/usr/bin/env node

import { saveToken, showConfigStatus } from "./lib/config.js";
import { terminal } from "./lib/terminal.js";
import { validateToken } from "./lib/configValidator.js";
import { ZodError } from "zod";
import { VERSION } from "./lib/constants.js";

function showHelp(): void {
  terminal.header("Zyraa CLI - Full Stack Code Generation Tool");
  terminal.newLine();

  terminal.usage(
    "zyraa <command> [options]",
    "Generate full stack applications from the terminal"
  );
  terminal.newLine();

  terminal.section("Commands");
  terminal.option("config <token>", "Configure CLI with authentication token");
  terminal.option("config --status", "Show current configuration status");
  terminal.option("--version, -v", "Show version information");
  terminal.option("--help, -h", "Show this help message");
  terminal.newLine();

  terminal.section("Examples");
  terminal.dim("  $ zyraa config eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  terminal.dim("  $ zyraa config --status");
  terminal.newLine();
}

function showVersion(): void {
  terminal.highlight(`Zyraa CLI v${VERSION}`);
  terminal.newLine();
}

function handleConfigCommand(args: string[]): void {
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

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  if (command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  if (command === "--version" || command === "-v") {
    showVersion();
    return;
  }

  switch (command) {
    case "config":
      handleConfigCommand(args.slice(1));
      break;

    default:
      terminal.error(`Unknown command: ${command}`);
      terminal.newLine();
      terminal.dim("Run 'zyraa --help' for usage information");
      terminal.newLine();
      process.exit(1);
  }
}

main();
