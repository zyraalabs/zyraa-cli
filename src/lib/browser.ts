import { exec } from "child_process";
import { platformDetector } from "./platform.js";

export const openBrowser = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const browserCommand = platformDetector.getBrowserCommand();

    if (!browserCommand) {
      reject(
        new Error(
          `Platform ${platformDetector.getPlatformName()} is not supported for browser opening`
        )
      );
      return;
    }

    const command = `${browserCommand} "${url}"`;

    exec(command, (error) => {
      if (error) {
        reject(new Error(`Failed to open browser: ${error.message}`));
      } else {
        resolve();
      }
    });
  });
};

export const openBrowserSilent = (url: string): void => {
  const browserCommand = platformDetector.getBrowserCommand();
  if (!browserCommand) return;

  const command = `${browserCommand} "${url}"`;
  exec(command, () => {});
};