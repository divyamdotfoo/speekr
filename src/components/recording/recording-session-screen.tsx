import { Box, Text, useInput } from "ink";
import { useEffect, useState } from "react";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import type {
  RecordSession,
  RecordSessionPhase,
  RecordingStatus,
} from "../../types/index.ts";
import { BrailleVoiceIndicator } from "./braille-voice-indicator.tsx";

const BRAILLE_TICK_MS = 100;

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function RecordingSessionScreen({
  session,
  meta,
  topicTitle,
  topicDescription,
}: {
  session: RecordSession;
  meta?: string;
  topicTitle?: string;
  topicDescription?: string;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [brailleTick, setBrailleTick] = useState(0);
  const [status, setStatus] = useState<RecordingStatus>("speaking");
  const [phase, setPhase] = useState<RecordSessionPhase>("starting");
  const [hasStopped, setHasStopped] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setElapsedMs((value) => value + 250);
    }, 250);
    const brailleTimer = setInterval(() => {
      setBrailleTick((value) => value + 1);
    }, BRAILLE_TICK_MS);

    function onStatusChange(nextStatus: RecordingStatus) {
      setStatus(nextStatus);
    }
    function onPhaseChange(nextPhase: RecordSessionPhase) {
      setPhase(nextPhase);
    }

    session.on("status-change", onStatusChange);
    session.on("phase-change", onPhaseChange);

    return () => {
      clearInterval(tick);
      clearInterval(brailleTimer);
      session.off("status-change", onStatusChange);
      session.off("phase-change", onPhaseChange);
    };
  }, [session]);

  useInput((input, key) => {
    if (hasStopped) {
      return;
    }

    if (
      input.toLowerCase() === "q" ||
      key.escape ||
      (key.ctrl && input === "c")
    ) {
      setHasStopped(true);
      session.stop("user");
    }
  });

  return (
    <AppFrame title="Recording session" subtitle="record" meta={meta}>
      {topicTitle ? (
        <Box marginBottom={1} flexDirection="column">
          <Text color={theme.brand}>{topicTitle}</Text>
          {topicDescription ? (
            <Text color={theme.muted}>{topicDescription}</Text>
          ) : null}
        </Box>
      ) : null}

      {phase === "starting" ? (
        <Box marginBottom={1}>
          <Text color={theme.muted}>Starting microphone...</Text>
        </Box>
      ) : (
        <>
          <Box marginBottom={1}>
            <BrailleVoiceIndicator
              status={status}
              tick={brailleTick}
              width={30}
            />
          </Box>

          <Box marginBottom={1}>
            <Text color={theme.muted}>
              Duration: {formatElapsed(elapsedMs)}
            </Text>
          </Box>
        </>
      )}

      <Text color={theme.muted}>Press q to stop and save.</Text>
    </AppFrame>
  );
}
