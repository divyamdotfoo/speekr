import { Box, Text, useInput } from "ink";
import { useEffect, useMemo, useState } from "react";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import type { RecordSession } from "../../commands/record-session.ts";

const FRAMES = ["◴", "◷", "◶", "◵"] as const;

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function RecordingSessionScreen({
  session,
}: {
  session: RecordSession;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasSilenceWarning, setHasSilenceWarning] = useState(false);
  const [hasStopped, setHasStopped] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setElapsedMs((value) => value + 250);
    }, 250);

    function onWarning() {
      setHasSilenceWarning(true);
    }

    function onCleared() {
      setHasSilenceWarning(false);
    }

    session.on("silence-warning", onWarning);
    session.on("silence-cleared", onCleared);

    return () => {
      clearInterval(tick);
      session.off("silence-warning", onWarning);
      session.off("silence-cleared", onCleared);
    };
  }, [session]);

  useInput((input, key) => {
    if (hasStopped) {
      return;
    }

    if (input.toLowerCase() === "q" || key.escape || (key.ctrl && input === "c")) {
      setHasStopped(true);
      session.stop("user");
    }
  });

  const frame = useMemo(() => {
    const idx = Math.floor(elapsedMs / 250) % FRAMES.length;
    return FRAMES[idx];
  }, [elapsedMs]);

  return (
    <AppFrame title="Recording session" subtitle="record">
      <Box marginBottom={1}>
        <Text color={theme.brand}>{frame}</Text>
        <Text color={theme.muted}>  Listening</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.success}>REC</Text>
        <Text color={theme.muted}>  ·  </Text>
        <Text color={theme.text}>{formatElapsed(elapsedMs)}</Text>
      </Box>

      <Box marginBottom={1}>
        {hasSilenceWarning ? (
          <Text color={theme.warning}>
            Silent for 20s. Speak in 10s or capture stops automatically.
          </Text>
        ) : (
          <Text color={theme.muted}>
            Auto-stop is enabled after 30s of continuous silence.
          </Text>
        )}
      </Box>

      <Text color={theme.muted}>Press q to stop and save.</Text>
    </AppFrame>
  );
}
