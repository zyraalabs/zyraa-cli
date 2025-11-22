import { terminal } from "../lib/terminal.js";

export function showHelp(): void {
  terminal.header("Zyraa CLI - Full Stack Code Generation Tool");
  terminal.newLine();

  terminal.usage(
    "zyraa <command> [options]",
    "Generate full stack applications from the terminal"
  );
  terminal.newLine();

  terminal.section("Commands");
  terminal.option("login", "Authenticate CLI with your Zyraa account");
  terminal.option("config <token>", "Configure CLI with authentication token");
  terminal.option("config --status", "Show current configuration status");
  terminal.option("--version, -v", "Show version information");
  terminal.option("--help, -h", "Show this help message");
  terminal.newLine();

  terminal.section("Examples");
  terminal.dim("  $ zyraa login");
  terminal.dim("  $ zyraa config eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
  terminal.dim("  $ zyraa config --status");
  terminal.newLine();
}
