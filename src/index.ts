#!/usr/bin/env node

import { showHelp } from "./components/help.js";
import { showVersion } from "./components/version.js";
import { handleConfigCommand } from "./components/config.js";
import { handleLoginCommand } from "./components/login.js";
import { terminal } from "./lib/terminal.js";

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
    case "login":
      handleLoginCommand();
      break;

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
