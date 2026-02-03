import { terminal } from "./terminal.js";

export function handleGenerationError(error: unknown): never {
  terminal.newLine();

  const err = error as {
    response?: {
      status?: number;
      data?: unknown;
    };
  };

  const status = err?.response?.status;
  const data = err?.response?.data as { error?: string } | undefined;
  const message = data?.error;

  if (status === 401) {
    terminal.error("Authentication expired or invalid");
    terminal.dim("Run 'zyraa login' to re-authenticate");
  } else if (status === 429) {
    terminal.error("Rate limit exceeded");
    terminal.dim("Please wait a moment and try again");
  } else {
    terminal.error(message || "Could not connect to Zyraa server");
    terminal.dim("Check your internet connection and try again");
  }

  terminal.newLine();
  process.exit(1);
}

export function handleUnexpectedError(error: Error): never {
  terminal.newLine();
  terminal.error(error.message || "An unexpected error occurred");
  terminal.dim("Please try again");
  terminal.newLine();
  process.exit(1);
}
