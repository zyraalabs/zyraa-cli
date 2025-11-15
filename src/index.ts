#!/usr/bin/env node

import chalk from "chalk";
import { saveToken, showConfigStatus } from "./lib/config.js";
import { terminal } from "./lib/terminal.js";
import { validateToken } from "./lib/configValidator.js";
import { ZodError } from "zod";

const VERSION = "1.0.0";

function showHelp(): void {
  terminal.header("Zyra CLI - Full Stack Code Generation Tool");
  terminal.separator();
  terminal.newLine();

  terminal.usage(
    "zyraa <command> [options]",
    "A terminal-based full stack code generation tool"
  );
  terminal.newLine();

  terminal.log("showHelp", "Displaying help information");
  console.log(chalk.bold("Commands:"));
  terminal.option(
    "config <token>",
    "Configure Zyraa CLI with authentication token"
  );
  terminal.option("config --status", "Show current configuration status");
  terminal.option("--version, -v", "Show version information");
  terminal.option("--help, -h", "Show this help message");
  terminal.newLine();

  console.log(chalk.bold("Examples:"));
  terminal.dim("  $ zyraa config eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  terminal.dim("  $ zyraa config --status");
  terminal.newLine();
}

function showVersion(): void {
  terminal.log("showVersion", `Displaying version: ${VERSION}`);
  terminal.highlight(`Zyra CLI v${VERSION}`);
  terminal.newLine();
}

function handleConfigCommand(args: string[]): void {
  if (args.includes("--status") || args.includes("-s")) {
    terminal.log("handleConfigCommand", "Showing configuration status");
    showConfigStatus();
    return;
  }

  const token = args[0];

  if (!token) {
    terminal.error("No token provided", "handleConfigCommand");
    terminal.newLine();
    terminal.usage(
      "zyraa config <token>",
      "Configure Zyra CLI with your authentication token"
    );
    terminal.newLine();
    terminal.dim("Get your token from the Zyra dashboard:");
    terminal.dim("https://zyra.dev/dashboard");
    terminal.newLine();
    process.exit(1);
  }

  try {
    validateToken(token);
    terminal.log("handleConfigCommand", "Token validation successful");
    saveToken(token);
  } catch (error) {
    if (error instanceof ZodError) {
      terminal.error("Invalid token format", "handleConfigCommand", error);
      terminal.dim(error.issues[0].message);
    } else {
      terminal.error(
        "Failed to save configuration",
        "handleConfigCommand",
        error
      );
      terminal.dim(error instanceof Error ? error.message : "Unknown error");
    }
    terminal.newLine();
    process.exit(1);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  terminal.log("main", `CLI started with args: ${args.join(" ")}`);

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
      terminal.error(`Unknown command: ${command}`, "main");
      terminal.newLine();
      terminal.dim("Run 'zyraa --help' for usage information");
      terminal.newLine();
      process.exit(1);
  }
}

main();
