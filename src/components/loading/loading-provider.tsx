import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type PropsWithChildren } from "react";
import { Box, Text } from "ink";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import { LOG_PANEL_LINES } from "../../constants/index.ts";
import { buildFixedLogLines, formatClock, getSpinnerFrame } from "../progress/utils.ts";
import type { LoadingController } from "./loading-controller.ts";

export function LoadingProvider<StepId extends string>(
  input: PropsWithChildren<{ controller: LoadingController<StepId> }>
) {
  const [tick, setTick] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const state = useSyncExternalStore(
    input.controller.subscribe,
    input.controller.getState
  );

  useEffect(() => {
    if (!state.visible || state.status !== "running") {
      setTick(0);
      setElapsedSeconds(0);
      return;
    }

    const tickTimer = setInterval(() => {
      setTick((value) => value + 1);
    }, TICK_INTERVAL_MS);
    const elapsedTimer = setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, ELAPSED_INTERVAL_MS);

    return () => {
      clearInterval(tickTimer);
      clearInterval(elapsedTimer);
    };
  }, [state.visible, state.status]);

  const value = useMemo(
    () => input.controller as unknown as LoadingController<string>,
    [input.controller]
  );

  return (
    <LoadingControllerContext.Provider value={value}>
      {input.children}
      {state.visible ? (
        <AppFrame title={state.title} subtitle={state.subtitle}>
          <Box marginBottom={1}>
            <Text color={state.status === "error" ? theme.danger : theme.success}>
              {getSpinnerFrame(tick)}
            </Text>
            <Text color={theme.muted}> </Text>
            <Text color={theme.text}>{state.step ?? "Working"}</Text>
            <Text color={theme.muted}>
              {" "}
              · Elapsed: {formatClock(elapsedSeconds)}
            </Text>
          </Box>

          <Box marginBottom={1}>
            <Text color={state.status === "error" ? theme.danger : theme.muted}>
              {state.message}
              {state.hint ? ` ${state.hint}` : ""}
            </Text>
          </Box>

          <Box marginBottom={1} flexDirection="column">
            {state.checklist.map((item) => (
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
            {buildFixedLogLines(state.logs, LOG_PANEL_LINES).map((line, index) => (
              <Text key={`${index}-${line}`} color={theme.muted}>
                {line}
              </Text>
            ))}
          </Box>
        </AppFrame>
      ) : null}
    </LoadingControllerContext.Provider>
  );
}

export function useLoadingController<StepId extends string>() {
  const context = useContext(LoadingControllerContext);
  if (!context) {
    throw new Error("useLoadingController must be used within LoadingProvider.");
  }
  return context as unknown as LoadingController<StepId>;
}

const LoadingControllerContext = createContext<LoadingController<string> | null>(null);
const TICK_INTERVAL_MS = 120;
const ELAPSED_INTERVAL_MS = 1000;
