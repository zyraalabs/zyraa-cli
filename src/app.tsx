import { render } from "ink";
import { App } from "./components/App.js";
import { Login } from "./components/Login.js";
import { ThemeProvider } from "./components/ui/ThemeContext.js";
import { showHelp } from "./components/help.js";
import { showVersion } from "./components/version.js";
import { handleConfigCommand } from "./components/config.js";

export function startApp(args: string[]): void {
  const command = args[0];

  if (command === "--help" || command === "-h") { showHelp(); return; }
  if (command === "--version" || command === "-v") { showVersion(); return; }
  if (command === "config") { handleConfigCommand(args.slice(1)); return; }

  if (command === "login") {
    render(<ThemeProvider><Login /></ThemeProvider>);
    return;
  }

  const KNOWN_FLAGS = ["--deploy"];
  const unknown = args.filter((a) => !KNOWN_FLAGS.includes(a));

  if (unknown.length) {
    console.error(`Unknown argument: ${unknown[0]}\n`);
    showHelp();
    process.exitCode = 1;
    return;
  }

  const deploy = args.includes("--deploy");

  render(<ThemeProvider><App deploy={deploy} /></ThemeProvider>);
}
