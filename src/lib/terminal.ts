import chalk from "chalk";
import ora, { Ora } from "ora";

type LogLevel = "info" | "error" | "warn" | "success";

class Terminal {
  private formatLogMessage(
    fnName: string,
    message: string,
    level: LogLevel
  ): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(7);
    return `${timestamp} [${levelStr}] [${fnName}] ${message}`;
  }

  log(fnName: string, message: string): void {
    console.log(this.formatLogMessage(fnName, message, "info"));
  }

  error(message: string, fnName?: string, error?: any): void {
    if (fnName) {
      const errorMsg = error
        ? `${message} - ${error.message || error}`
        : message;
      console.error(this.formatLogMessage(fnName, errorMsg, "error"));
    } else {
      console.log(chalk.red("✗") + " " + chalk.white(message));
    }
  }

  warn(message: string, fnName?: string): void {
    if (fnName) {
      console.warn(this.formatLogMessage(fnName, message, "warn"));
    } else {
      console.log(chalk.yellow("⚠") + " " + chalk.white(message));
    }
  }

  success(message: string, fnName?: string): void {
    if (fnName) {
      console.log(this.formatLogMessage(fnName, message, "success"));
    } else {
      console.log(chalk.green("✓") + " " + chalk.white(message));
    }
  }

  info(message: string): void {
    console.log(chalk.blue("ℹ") + " " + chalk.white(message));
  }

  header(message: string): void {
    console.log("\n" + chalk.bold.cyan(message));
  }

  separator(): void {
    console.log(chalk.gray("─".repeat(50)));
  }

  label(label: string, value: string): void {
    console.log(chalk.gray(label + ":") + " " + chalk.white(value));
  }

  highlight(message: string): void {
    console.log(chalk.cyan(message));
  }

  dim(message: string): void {
    console.log(chalk.gray(message));
  }

  spinner(text: string): Ora {
    return ora({
      text: chalk.white(text),
      color: "cyan",
    });
  }

  newLine(): void {
    console.log();
  }

  clear(): void {
    console.clear();
  }

  box(
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ): void {
    const colors = {
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.cyan,
    };

    const color = colors[type];
    const lines = message.split("\n");
    const maxLength = Math.max(...lines.map((line) => line.length));
    const padding = 2;
    const width = maxLength + padding * 2;

    console.log();
    console.log(color("┌" + "─".repeat(width) + "┐"));
    lines.forEach((line) => {
      const spaces = " ".repeat(width - line.length - padding);
      console.log(
        color("│") + " ".repeat(padding) + line + spaces + color("│")
      );
    });
    console.log(color("└" + "─".repeat(width) + "┘"));
    console.log();
  }

  usage(command: string, description: string): void {
    console.log(chalk.bold("Usage:") + " " + chalk.cyan(command));
    console.log(chalk.gray(description));
  }

  option(flag: string, description: string): void {
    console.log("  " + chalk.cyan(flag.padEnd(20)) + chalk.gray(description));
  }
}

export const terminal = new Terminal();
