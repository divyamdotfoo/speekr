import { Box, Text, useInput } from "ink";
import { useEffect, useMemo, useState } from "react";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import type { RecordSession } from "../../types/index.ts";
import { RECORDING_SILENCE_CONFIG } from "../../constants/index.ts";
import { getSpinnerFrame } from "../progress/utils.ts";

const SPINNER_TICK_MS = 120;

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function RecordingSessionScreen({
  session,
  meta,
  topicHints,
  topicTitle,
  topicDescription,
}: {
  session: RecordSession;
  meta?: string;
  topicHints?: string[];
  topicTitle?: string;
  topicDescription?: string;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [spinnerTick, setSpinnerTick] = useState(0);
  const [hasSilenceWarning, setHasSilenceWarning] = useState(false);
  const [showTopicHint, setShowTopicHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);
  const [hasStopped, setHasStopped] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setElapsedMs((value) => value + 250);
    }, 250);
    const spinnerTimer = setInterval(() => {
      setSpinnerTick((value) => value + 1);
    }, SPINNER_TICK_MS);

    function onWarning() {
      setHasSilenceWarning(true);
    }

    function onCleared() {
      setHasSilenceWarning(false);
      setShowTopicHint(false);
      setHintIndex(-1);
    }

    function onHintTick() {
      if (!topicHints || topicHints.length === 0) {
        return;
      }
      setShowTopicHint(true);
      setHintIndex((value) => (value + 1) % topicHints.length);
    }

    session.on("silence-warning", onWarning);
    session.on("silence-cleared", onCleared);
    session.on("silence-hint-tick", onHintTick);

    return () => {
      clearInterval(tick);
      clearInterval(spinnerTimer);
      session.off("silence-warning", onWarning);
      session.off("silence-cleared", onCleared);
      session.off("silence-hint-tick", onHintTick);
    };
  }, [session, topicHints]);

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

  const spinner = useMemo(() => getSpinnerFrame(spinnerTick), [spinnerTick]);
  const activeHint =
    topicHints && topicHints.length > 0 && hintIndex >= 0
      ? topicHints[hintIndex]
      : null;
  const showSilenceUi = hasSilenceWarning;

  return (
    <AppFrame title="Recording session" subtitle="record" meta={meta}>
      <Box marginBottom={1}>
        <Text color={theme.success}>{spinner}</Text>
        <Text color={theme.muted}> </Text>
        <Text color={theme.text}>Listening</Text>
        <Text color={theme.muted}> · {formatElapsed(elapsedMs)}</Text>
      </Box>

      {topicTitle ? (
        <Box marginBottom={1} flexDirection="column">
          <Text color={theme.brand}>{topicTitle}</Text>
          {topicDescription ? (
            <Text color={theme.muted}>{topicDescription}</Text>
          ) : null}
        </Box>
      ) : null}

      {showSilenceUi ? (
        <Box marginBottom={1} flexDirection="column">
          <Text color={theme.warning}>
            {`Silent for ${Math.floor(
              RECORDING_SILENCE_CONFIG.silenceWarningMs / 1000
            )}s. Speak now or capture stops automatically in ${Math.max(
              0,
              Math.ceil(
                (RECORDING_SILENCE_CONFIG.silenceAutoStopMs -
                  RECORDING_SILENCE_CONFIG.silenceWarningMs) /
                  1000
              )
            )}s.`}
          </Text>
          {showTopicHint && activeHint ? (
            <Box marginTop={1} flexDirection="column">
              <Text color={theme.accent}>Hint</Text>
              <Text color={theme.text}>{activeHint}</Text>
            </Box>
          ) : null}
        </Box>
      ) : null}

      <Text color={theme.muted}>Press q to stop and save.</Text>
    </AppFrame>
  );
}
