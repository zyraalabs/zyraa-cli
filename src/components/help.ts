import { terminal } from "../lib/terminal.js";

export function showHelp(): void {
  terminal.header("Zyraa CLI - Full Stack Code Generation Tool");
  terminal.newLine();

  terminal.usage(
    'zyraa "<prompt>"',
    "Generate full stack applications from the terminal"
  );
  terminal.newLine();

  terminal.section("Commands");
  terminal.option("<prompt>", "Generate a project from a natural language prompt");
  terminal.option("login", "Authenticate CLI with your Zyraa account");
  terminal.option("config <token>", "Configure CLI with authentication token");
  terminal.option("config --status", "Show current configuration status");
  terminal.option("--version, -v", "Show version information");
  terminal.option("--help, -h", "Show this help message");
  terminal.newLine();

  terminal.section("Examples");
  terminal.dim('  $ zyraa "build a todo app with Next.js"');
  terminal.dim('  $ zyraa "create a blog with markdown support"');
  terminal.dim("  $ zyraa login");
  terminal.dim("  $ zyraa config --status");
  terminal.newLine();
}
