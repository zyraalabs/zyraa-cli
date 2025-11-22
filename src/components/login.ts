import { terminal } from "../lib/terminal.js";
import { saveToken } from "../lib/config.js";
import { authApi } from "../api/endpoints/auth.js";
import { openBrowserSilent } from "../lib/browser.js";
import { pollForApproval } from "../helpers/polling.js";
import ora from "ora";

export async function handleLoginCommand(): Promise<void> {
  terminal.header("Zyra CLI Login");
  terminal.newLine();

  try {
    const spinner = ora("Initializing login request...").start();

    const initResult = await authApi.initLogin();

    if (initResult.code === "error") {
      spinner.fail("Failed to initialize login");
      terminal.error("Could not connect to authentication server");
      process.exit(1);
    }

    const initData = initResult.data;

    if (!initData.success) {
      spinner.fail("Failed to initialize login");
      terminal.error(initData.error || "Unknown error occurred");
      process.exit(1);
    }

    const { requestId, url, expiresIn } = initData.data;

    spinner.succeed("Login request initialized");
    terminal.newLine();

    terminal.highlight(`Opening browser for authentication...`);
    terminal.dim(`If browser doesn't open, visit:`);
    terminal.dim(`  ${url}`);
    terminal.newLine();

    openBrowserSilent(url);

    const pollSpinner = ora("Waiting for approval...").start();

    const token = await pollForApproval(requestId, expiresIn, pollSpinner);

    pollSpinner.succeed("Login approved!");
    terminal.newLine();

    saveToken(token);

    terminal.success("Successfully authenticated!");
    terminal.newLine();
    terminal.label("Token saved to", "~/.zyra/config");
    terminal.newLine();
  } catch (error: any) {
    terminal.newLine();
    terminal.error(error.message || "Login failed");
    terminal.dim("Please try again with 'zyra login'");
    process.exit(1);
  }
}
