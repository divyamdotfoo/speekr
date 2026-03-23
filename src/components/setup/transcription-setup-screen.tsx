import { useEffect } from "react";
import { ensureTranscriptionRuntime } from "../../services/transcription/index.ts";
import {
  createLoadingController,
  type LoadingStep,
} from "../loading/loading-controller.ts";
import { useLoadingController } from "../loading/loading-provider.tsx";
import { runWithLoadingUI } from "../loading/run-with-loading-ui.tsx";

export async function runTranscriptionSetupScreen() {
  if (!process.stdin.isTTY) {
    await ensureTranscriptionRuntime();
    return;
  }

  const controller = createLoadingController<RuntimeSetupStep>();
  await runWithLoadingUI<RuntimeSetupStep, void>({
    controller,
    renderContent: (handlers) => (
      <TranscriptionSetupScreen
        onSuccess={() => handlers.onSuccess(undefined)}
        onError={handlers.onError}
      />
    ),
  });
}

export function TranscriptionSetupScreen(input: {
  onSuccess: () => void;
  onError: (error: Error) => void;
}) {
  const loading = useLoadingController<RuntimeSetupStep>();

  useEffect(() => {
    let isMounted = true;

    loading.showLoadingUI({
      title: "Preparing transcription runtime",
      subtitle: "setup",
      steps: RUNTIME_SETUP_STEPS,
      initialStep: "checking",
      message: "Checking Python runtime and virtual environment.",
    });
    loading.appendLoadingLog(
      "We need Python and speech dependencies to transcribe audio locally on your device."
    );

    ensureTranscriptionRuntime({
      onEvent(event) {
        if (!isMounted) {
          return;
        }
        loading.updateLoadingUI({
          step: event.step as RuntimeSetupStep,
          message: event.message,
          hint: event.hint,
        });
      },
      onLog(line) {
        if (!isMounted) {
          return;
        }
        loading.appendLoadingLog(line);
      },
    })
      .then(() => {
        if (!isMounted) {
          return;
        }
        loading.completeLoadingUI({
          step: "complete",
          message: "Python transcription runtime is ready.",
        });
        setTimeout(() => {
          if (!isMounted) {
            return;
          }
          input.onSuccess();
        }, COMPLETION_DELAY_MS);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        const resolvedError =
          error instanceof Error
            ? error
            : new Error("Runtime preparation failed.");
        loading.failLoadingUI(resolvedError, {
          message: resolvedError.message,
        });
        input.onError(resolvedError);
      });

    return () => {
      isMounted = false;
      loading.hideLoadingUI();
    };
  }, [input, loading]);

  return null;
}

const RUNTIME_SETUP_STEPS = [
  { id: "checking", label: "Checking Python runtime" },
  { id: "creating_venv", label: "Virtual environment configured" },
  { id: "upgrading_pip", label: "Pip upgraded" },
  { id: "installing_packages", label: "Speech dependencies installed" },
  { id: "complete", label: "Runtime ready" },
] satisfies ReadonlyArray<LoadingStep<RuntimeSetupStep>>;

type RuntimeSetupStep =
  | "checking"
  | "creating_venv"
  | "upgrading_pip"
  | "installing_packages"
  | "complete";

const COMPLETION_DELAY_MS = 500;
