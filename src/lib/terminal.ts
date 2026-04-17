import chalk from "chalk";

class Terminal {
  error(message: string, fnName?: string, error?: any): void {
    if (fnName && error) {
      const errorMsg = error.message || error;
      console.error(
        chalk.hex("#B91C1C").bold("✗ ") + chalk.hex("#DC2626")(message)
      );
      console.error(chalk.hex("#6B7280")(`  ${errorMsg}`));
    } else {
      console.log(
        chalk.hex("#B91C1C").bold("✗ ") + chalk.hex("#DC2626")(message)
      );
    }
  }

  warn(message: string): void {
    console.log(
      chalk.hex("#B45309").bold("⚠ ") + chalk.hex("#D97706")(message)
    );
  }

  success(message: string): void {
    console.log(
      chalk.hex("#047857").bold("✓ ") + chalk.hex("#059669")(message)
    );
  }

  header(message: string): void {
    const line = chalk.hex("#7C3AED")("━".repeat(60));
    console.log("\n" + line);
    console.log(
      chalk.hex("#7C3AED")("  ") + chalk.hex("#1F2937").bold(message)
    );
    console.log(line + "\n");
  }

  separator(): void {
    console.log(chalk.hex("#9CA3AF")("─".repeat(60)));
  }

  label(label: string, value: string): void {
    console.log(
      chalk.hex("#7C3AED")(label + ":") + " " + chalk.hex("#374151")(value)
    );
  }

  highlight(message: string): void {
    console.log(
      chalk.hex("#C026D3").bold("▸ ") + chalk.hex("#D946EF")(message)
    );
  }

  dim(message: string): void {
    console.log(chalk.hex("#6B7280")(message));
  }

  newLine(): void {
    console.log();
  }

  usage(command: string, description: string): void {
    console.log(
      chalk.hex("#7C3AED").bold("Usage: ") + chalk.hex("#0891B2")(command)
    );
    console.log(chalk.hex("#6B7280")(description));
  }

  option(flag: string, description: string): void {
    console.log(
      "  " +
        chalk.hex("#0891B2")(flag.padEnd(25)) +
        chalk.hex("#374151")(description)
    );
  }

  section(title: string): void {
    console.log(chalk.hex("#7C3AED").bold("\n" + title + ":"));
  }

  step(message: string): void {
    console.log(
      chalk.hex("#6B7280")("  └ ") + chalk.hex("#0891B2")(message)
    );
  }
}

export const terminal = new Terminal();
