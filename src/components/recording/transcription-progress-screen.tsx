import { Box, Text, render } from "ink";
import { useEffect, useState } from "react";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import { transcribeRecording } from "../../services/transcription/index.ts";
import type {
  TranscriptionProgressEvent,
  TranscriptionResult,
} from "../../types/index.ts";

export async function runTranscriptionProgressScreen(input: {
  audioPath: string;
  languageCode?: string;
}) {
  if (!process.stdin.isTTY) {
    return await transcribeRecording({
      audioPath: input.audioPath,
      languageCode: input.languageCode,
    });
  }

  return await new Promise<TranscriptionResult>((resolve, reject) => {
    const instance = render(
      <TranscriptionProgressScreen
        audioPath={input.audioPath}
        languageCode={input.languageCode}
        onSuccess={(result) => {
          instance.unmount();
          resolve(result);
        }}
        onError={(error) => {
          instance.unmount();
          reject(error);
        }}
      />
    );
  });
}

export function TranscriptionProgressScreen(input: {
  audioPath: string;
  languageCode?: string;
  onSuccess: (result: TranscriptionResult) => void;
  onError: (error: Error) => void;
}) {
  const [event, setEvent] = useState<TranscriptionProgressEvent>({
    step: "starting",
    message: "Preparing transcription process.",
    progressBar: "[#-------------------]",
    percent: null,
    isIndeterminate: true,
    stageLabel: "Preparing process",
  });
  const [tick, setTick] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    transcribeRecording({
      audioPath: input.audioPath,
      languageCode: input.languageCode,
      onEvent(nextEvent) {
        if (!isMounted) {
          return;
        }
        setEvent(nextEvent);
      },
      onLog(line) {
        if (!isMounted) {
          return;
        }
        setLogs((current) => {
          const next = [...current, line];
          return next.slice(-LOG_PANEL_LINES);
        });
      },
    })
      .then((result) => {
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) {
              input.onSuccess(result);
            }
          }, 500);
        }
      })
      .catch((error) => {
        if (isMounted) {
          input.onError(error as Error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [input]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checklist = getTranscriptionChecklist(event.step);
  const displayBar = event.isIndeterminate
    ? buildMarqueeProgressBar(tick)
    : buildDeterminateProgressBar(event.percent);

  return (
    <AppFrame title="Transcribing recording" subtitle="record">
      <Box marginBottom={1}>
        <Text color={theme.success}>{displayBar}</Text>
        <Text color={theme.muted}> </Text>
        <Text color={theme.text}>{event.stageLabel ?? "Working"}</Text>
        <Text color={theme.muted}>
          {" "}
          · Elapsed: {formatClock(elapsedSeconds)}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.muted}>
          {event.message}
          {event.hint ? ` ${event.hint}` : ""}
        </Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        {checklist.map((item) => (
          <Text
            key={item.id}
            color={
              item.state === "done"
                ? theme.success
                : item.state === "active"
                ? theme.text
                : theme.muted
            }
          >
            {item.state === "done" ? "✓" : item.state === "active" ? "›" : "○"}{" "}
            {item.label}
          </Text>
        ))}
      </Box>

      <Box flexDirection="column">
        <Text color={theme.muted}>Live logs</Text>
        {buildFixedLogLines(logs, LOG_PANEL_LINES).map((line, index) => (
          <Text key={`${index}-${line}`} color={theme.muted}>
            {line}
          </Text>
        ))}
      </Box>
    </AppFrame>
  );
}

function buildMarqueeProgressBar(tick: number) {
  const width = 24;
  const head = tick % width;
  const chars = new Array<string>(width).fill("-");
  chars[head] = "#";
  if (head > 0) {
    chars[head - 1] = "#";
  }
  if (head > 1) {
    chars[head - 2] = "#";
  }
  return `[${chars.join("")}]`;
}

function buildDeterminateProgressBar(percent: number | null) {
  const safePercent = percent ?? 0;
  const width = 24;
  const filled = Math.max(1, Math.round((safePercent / 100) * width));
  return `[${"#".repeat(filled)}${"-".repeat(Math.max(0, width - filled))}]`;
}

function getTranscriptionChecklist(step: TranscriptionProgressEvent["step"]) {
  const order: TranscriptionProgressEvent["step"][] = [
    "starting",
    "loading_model",
    "transcribing",
    "writing_output",
    "complete",
  ];
  const labels: Record<TranscriptionProgressEvent["step"], string> = {
    starting: "Preparing process",
    loading_model: "Loading model",
    transcribing: "Transcribing audio",
    writing_output: "Saving transcript",
    complete: "Completed",
  };
  const activeIndex = order.indexOf(step);

  return order.map((id, index) => {
    if (activeIndex === -1) {
      return { id, label: labels[id], state: "pending" as const };
    }
    if (index < activeIndex || step === "complete") {
      return { id, label: labels[id], state: "done" as const };
    }
    if (index === activeIndex) {
      return { id, label: labels[id], state: "active" as const };
    }
    return { id, label: labels[id], state: "pending" as const };
  });
}

function formatClock(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

const LOG_PANEL_LINES = 6;

function buildFixedLogLines(logs: string[], lineCount: number) {
  const visible = logs.slice(-lineCount);
  const padCount = Math.max(0, lineCount - visible.length);
  const padding = new Array<string>(padCount).fill(" ");
  return [...padding, ...visible];
}
