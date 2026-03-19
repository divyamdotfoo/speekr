import { Box, Text, render } from "ink";
import { useEffect, useState } from "react";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import {
  ensureTranscriptionRuntime,
  type RuntimeSetupEvent,
} from "../../services/transcription/index.ts";

export async function runTranscriptionSetupScreen() {
  if (!process.stdin.isTTY) {
    await ensureTranscriptionRuntime();
    return;
  }

  return await new Promise<void>((resolve, reject) => {
    const instance = render(
      <TranscriptionSetupScreen
        onSuccess={() => {
          instance.unmount();
          resolve();
        }}
        onError={(error) => {
          instance.unmount();
          reject(error);
        }}
      />,
    );
  });
}

export function TranscriptionSetupScreen(input: {
  onSuccess: () => void;
  onError: (error: Error) => void;
}) {
  const [event, setEvent] = useState<RuntimeSetupEvent>({
    step: "checking",
    message: "Checking Python runtime and virtual environment.",
    progressBar: "[#-------------------]",
    percent: null,
    isIndeterminate: true,
    stageLabel: "Checking runtime",
  });
  const [tick, setTick] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    ensureTranscriptionRuntime({
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
      .then(() => {
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) {
              input.onSuccess();
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

  const checklist = getSetupChecklistStatus(event.step);
  const displayBar = event.isIndeterminate
    ? buildMarqueeProgressBar(tick)
    : buildDeterminateProgressBar(event.percent);

  return (
    <AppFrame title="Preparing transcription runtime" subtitle="setup">
      <Box marginBottom={1}>
        <Text color={theme.success}>{displayBar}</Text>
        <Text color={theme.muted}>  </Text>
        <Text color={theme.text}>{event.stageLabel ?? "Preparing runtime"}</Text>
        <Text color={theme.muted}>  ·  Elapsed: {formatClock(elapsedSeconds)}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={theme.muted}>
          {event.message}
          {event.hint ? ` ${event.hint}` : ""}
        </Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text color={theme.muted}>
          We need Python and speech dependencies to transcribe audio locally on your device.
        </Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        {checklist.map((item) => (
          <Text
            key={item.id}
            color={item.state === "done" ? theme.success : item.state === "active" ? theme.text : theme.muted}
          >
            {item.state === "done" ? "✓" : item.state === "active" ? "›" : "○"} {item.label}
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

function getSetupChecklistStatus(step: RuntimeSetupEvent["step"]) {
  const order: RuntimeSetupEvent["step"][] = [
    "checking",
    "creating_venv",
    "upgrading_pip",
    "installing_packages",
    "complete",
  ];
  const labels: Record<RuntimeSetupEvent["step"], string> = {
    checking: "Checking Python runtime",
    creating_venv: "Virtual environment configured",
    upgrading_pip: "Pip upgraded",
    installing_packages: "Speech dependencies installed",
    complete: "Runtime ready",
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
