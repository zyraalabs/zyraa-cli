import { terminal } from "../lib/terminal.js";
import { VERSION } from "../lib/constants.js";

export function showVersion(): void {
  terminal.highlight(`Zyraa CLI v${VERSION}`);
  terminal.newLine();
}

