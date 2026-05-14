import { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { Header } from "./ui/Header.js";
import { Badge } from "./ui/Badge.js";
import { Spinner } from "./ui/Spinner.js";
import { Divider } from "./ui/Divider.js";
import { useTheme } from "./ui/ThemeContext.js";
import { authApi } from "../api/endpoints/auth.js";
import { saveToken } from "../lib/config.js";
import { openBrowserSilent } from "../lib/browser.js";
import { pollForApproval } from "../helpers/polling.js";

type Stage = "init" | "pending" | "done" | "error";

export function Login() {
  const { exit } = useApp();
  const theme     = useTheme();
  const [stage, setStage]               = useState<Stage>("init");
  const [loginUrl, setLoginUrl]         = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (stage !== "done" && stage !== "error") return;
    const id = setTimeout(exit, 150);
    return () => clearTimeout(id);
  }, [stage, exit]);

  useEffect(() => {
    const run = async () => {
      try {
        const initResult = await authApi.initLogin();

        if (initResult.code === "error" || !initResult.data.success) {
          setErrorMessage("Could not connect to authentication server");
          setStage("error");
          return;
        }

        const { requestId, url, expiresIn } = initResult.data.data;
        setLoginUrl(url);
        setStage("pending");
        openBrowserSilent(url);

        const token = await pollForApproval(requestId, expiresIn);
        saveToken(token);
        setStage("done");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Login failed");
        setStage("error");
      }
    };

    run();
  }, []);

  return (
    <Box flexDirection="column" paddingY={1}>
      <Header prompt="Login to Zyraa" />

      <Box flexDirection="column" paddingX={2} gap={1}>
        {stage === "init" && (
          <Spinner label="Initializing login..." />
        )}

        {stage === "pending" && (
          <Box flexDirection="column" gap={1}>
            <Box gap={1}>
              <Text color={theme.success} bold>{"✓"}</Text>
              <Text color={theme.fgMuted}>{"Browser opened for authentication"}</Text>
            </Box>
            <Spinner label="Waiting for browser approval..." />
            {loginUrl && (
              <Box flexDirection="column" gap={0} marginTop={1}>
                <Text color={theme.fgMuted}>{"If browser did not open, visit:"}</Text>
                <Box gap={1} paddingLeft={2}>
                  <Text color={theme.fgSubtle}>{"›"}</Text>
                  <Text color={theme.brandLight}>{loginUrl}</Text>
                </Box>
              </Box>
            )}
            <Divider />
            <Text color={theme.fgSubtle}>
              {"waiting for browser approval  ·  ctrl+c to cancel"}
            </Text>
          </Box>
        )}

        {stage === "done" && (
          <Box flexDirection="column" gap={1}>
            <Badge type="success" label="Authenticated successfully" />
            <Box gap={1} paddingLeft={2}>
              <Text color={theme.fgSubtle}>{"→"}</Text>
              <Text color={theme.fgMuted}>{"~/.zyra/config"}</Text>
            </Box>
          </Box>
        )}

        {stage === "error" && (
          <Badge type="error" label={errorMessage} />
        )}
      </Box>
    </Box>
  );
}
