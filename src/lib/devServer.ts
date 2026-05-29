import http from "http";
import { startDevServer } from "./projectSetup.js";
import { openBrowserSilent } from "./browser.js";
import { IS_MOCK } from "./mock.js";

const DEV_URL = "http://localhost:3000";
const POLL_MS = 500;
const TIMEOUT_MS = 45_000;

function isServerReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(DEV_URL, () => {
      resolve(true);
      req.destroy();
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      resolve(false);
      req.destroy();
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function launchDevServer(projectDir: string): Promise<string | null> {
  if (IS_MOCK) return DEV_URL;

  const alreadyRunning = await isServerReady();
  if (!alreadyRunning) {
    startDevServer(projectDir);

    const deadline = Date.now() + TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(POLL_MS);
      if (await isServerReady()) break;
    }
  }

  const ready = await isServerReady();
  if (ready) {
    openBrowserSilent(DEV_URL);
    return DEV_URL;
  }

  return null;
}
