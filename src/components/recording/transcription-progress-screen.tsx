import { Box, Text, render } from "ink";
import { useEffect, useState } from "react";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import {
  transcribeRecordingLocally,
  transcribeRecordingWithAI,
} from "../../services/transcription/index.ts";
import type {
  HTTPSTranscriptionProgressEvent,
  TranscriptionProgressEvent,
  TranscriptionResult,
} from "../../types/index.ts";

type ProgressMode = "local" | "https";
type AnyTranscriptionProgressEvent =
  | TranscriptionProgressEvent
  | HTTPSTranscriptionProgressEvent;

const LOG_PANEL_LINES = 6;

export async function runTranscriptionProgressScreen(input: {
  audioPath: string;
  languageCode?: string;
}) {
  return await runProgressScreen({
    mode: "local",
    audioPath: input.audioPath,
    languageCode: input.languageCode,
  });
}

export async function runHTTPSTranscriptionProgressScreen(input: {
  audioPath: string;
  languageCode?: string;
}) {
  return await runProgressScreen({
    mode: "https",
    audioPath: input.audioPath,
    languageCode: input.languageCode,
  });
}

export function TranscriptionProgressScreen(input: {
  mode: ProgressMode;
  audioPath: string;
  languageCode?: string;
  onSuccess: (result: TranscriptionResult) => void;
  onError: (error: Error) => void;
}) {
  const [event, setEvent] = useState<AnyTranscriptionProgressEvent>(
    getInitialProgressEvent(input.mode)
  );
  const [tick, setTick] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const runTranscription =
      input.mode === "local"
        ? transcribeRecordingLocally({
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
        : transcribeRecordingWithAI({
            transcription: {
              audioPath: input.audioPath,
              languageCode: input.languageCode,
            },
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
          });

    runTranscription
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

  const checklist = getTranscriptionChecklist(input.mode, event.step);
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

async function runProgressScreen(input: {
  mode: ProgressMode;
  audioPath: string;
  languageCode?: string;
}) {
  if (!process.stdin.isTTY) {
    if (input.mode === "local") {
      return await transcribeRecordingLocally({
        audioPath: input.audioPath,
        languageCode: input.languageCode,
      });
    }

    return await transcribeRecordingWithAI({
      transcription: {
        audioPath: input.audioPath,
        languageCode: input.languageCode,
      },
    });
  }

  return await new Promise<TranscriptionResult>((resolve, reject) => {
    const instance = render(
      <TranscriptionProgressScreen
        mode={input.mode}
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

function getTranscriptionChecklist(
  mode: ProgressMode,
  step: AnyTranscriptionProgressEvent["step"]
) {
  if (mode === "local") {
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

    return mapChecklist(order, labels, step);
  }

  const order: HTTPSTranscriptionProgressEvent["step"][] = [
    "starting",
    "uploading_audio",
    "awaiting_provider",
    "writing_output",
    "complete",
  ];
  const labels: Record<HTTPSTranscriptionProgressEvent["step"], string> = {
    starting: "Preparing process",
    uploading_audio: "Uploading audio",
    awaiting_provider: "Waiting for provider",
    writing_output: "Saving transcript",
    complete: "Completed",
  };

  return mapChecklist(order, labels, step);
}

function mapChecklist<TStep extends string>(
  order: TStep[],
  labels: Record<TStep, string>,
  currentStep: string
) {
  const activeIndex = order.indexOf(currentStep as TStep);

  return order.map((id, index) => {
    if (activeIndex === -1) {
      return { id, label: labels[id], state: "pending" as const };
    }
    if (index < activeIndex || currentStep === "complete") {
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

function getInitialProgressEvent(mode: ProgressMode): AnyTranscriptionProgressEvent {
  if (mode === "local") {
    return {
      step: "starting",
      message: "Preparing transcription process.",
      progressBar: "[#-------------------]",
      percent: null,
      isIndeterminate: true,
      stageLabel: "Preparing process",
    };
  }

  return {
    step: "starting",
    message: "Preparing cloud transcription process.",
    progressBar: "[#-------------------]",
    percent: null,
    isIndeterminate: true,
    stageLabel: "Preparing process",
  };
}

function buildFixedLogLines(logs: string[], lineCount: number) {
  const visible = logs.slice(-lineCount);
  const padCount = Math.max(0, lineCount - visible.length);
  const padding = new Array<string>(padCount).fill(" ");
  return [...padding, ...visible];
}
