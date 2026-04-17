import { render } from "ink";
import { App } from "./components/App.js";
import { Generate } from "./components/Generate.js";
import { Login } from "./components/Login.js";
import { showHelp } from "./components/help.js";
import { showVersion } from "./components/version.js";
import { handleConfigCommand } from "./components/config.js";

export function startApp(args: string[]): void {
  const command = args[0];

  if (command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  if (command === "--version" || command === "-v") {
    showVersion();
    return;
  }

  if (command === "config") {
    handleConfigCommand(args.slice(1));
    return;
  }

  if (command === "login") {
    render(<Login />);
    return;
  }

  const prompt = args.join(" ").trim();

  if (!prompt) {
    render(<App />);
    return;
  }

  render(<Generate prompt={prompt} />);
}
