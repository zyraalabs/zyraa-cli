import { terminal } from "../lib/terminal.js";

export function showHelp(): void {
  terminal.header("Zyraa CLI - Full Stack Code Generation Tool");
  terminal.newLine();

  terminal.usage(
    "zyraa",
    "Start Zyraa, then describe what you want to build"
  );
  terminal.newLine();

  terminal.section("Commands");
  terminal.option("login", "Authenticate CLI with your Zyraa account");
  terminal.option("config <token>", "Configure CLI with authentication token");
  terminal.option("config --status", "Show current configuration status");
  terminal.option("--version, -v", "Show version information");
  terminal.option("--help, -h", "Show this help message");
  terminal.newLine();

  terminal.section("Flags");
  terminal.option("--deploy", "Publish each build live automatically");
  terminal.option("--agent", "Build with the agent (beta) instead of the classic pipeline");
  terminal.newLine();

  terminal.section("Examples");
  terminal.dim("  $ zyraa");
  terminal.dim("  $ zyraa --deploy");
  terminal.dim("  $ zyraa --agent");
  terminal.dim("  $ zyraa --agent --deploy");
  terminal.dim("  $ zyraa login");
  terminal.dim("  $ zyraa config --status");
  terminal.newLine();
}
