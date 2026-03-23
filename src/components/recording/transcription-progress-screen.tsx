import { useEffect } from "react";
import {
  transcribeRecordingLocally,
  transcribeRecordingWithAI,
} from "../../services/transcription/index.ts";
import type { TranscriptionResult } from "../../types/index.ts";
import {
  createLoadingController,
  type LoadingStep,
} from "../loading/loading-controller.ts";
import { useLoadingController } from "../loading/loading-provider.tsx";
import { runWithLoadingUI } from "../loading/run-with-loading-ui.tsx";

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

export async function runOpenAITranscriptionProgressScreen(input: {
  audioPath: string;
  languageCode?: string;
}) {
  return await runProgressScreen({
    mode: "openai",
    audioPath: input.audioPath,
    languageCode: input.languageCode,
  });
}

export async function runDeepgramTranscriptionProgressScreen(input: {
  audioPath: string;
  languageCode?: string;
}) {
  return await runProgressScreen({
    mode: "deepgram",
    audioPath: input.audioPath,
    languageCode: input.languageCode,
  });
}

function TranscriptionProgressScreen(input: {
  mode: ProgressMode;
  audioPath: string;
  languageCode?: string;
  onSuccess: (result: TranscriptionResult) => void;
  onError: (error: Error) => void;
}) {
  const loading = useLoadingController<TranscriptionStep>();

  useEffect(() => {
    let isMounted = true;
    const steps =
      input.mode === "local"
        ? LOCAL_TRANSCRIPTION_STEPS
        : CLOUD_TRANSCRIPTION_STEPS;

    loading.showLoadingUI({
      title: "Transcribing recording",
      subtitle: "record",
      steps,
      initialStep: "starting",
      message: "Preparing transcription process.",
    });

    const operation =
      input.mode === "local"
        ? transcribeRecordingLocally({
            audioPath: input.audioPath,
            languageCode: input.languageCode,
            onEvent(event) {
              if (!isMounted) {
                return;
              }
              loading.updateLoadingUI({
                step: event.step as TranscriptionStep,
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
        : transcribeRecordingWithAI({
            provider: input.mode,
            transcription: {
              audioPath: input.audioPath,
              languageCode: input.languageCode,
            },
            onEvent(event) {
              if (!isMounted) {
                return;
              }
              loading.updateLoadingUI({
                step: event.step as TranscriptionStep,
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
          });

    operation
      .then((result) => {
        if (!isMounted) {
          return;
        }
        loading.completeLoadingUI({
          step: "complete",
          message: "Transcription complete.",
        });
        setTimeout(() => {
          if (!isMounted) {
            return;
          }
          input.onSuccess(result);
        }, COMPLETION_DELAY_MS);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        const resolvedError =
          error instanceof Error ? error : new Error("Transcription failed.");
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
      provider: input.mode,
      transcription: {
        audioPath: input.audioPath,
        languageCode: input.languageCode,
      },
    });
  }

  const controller = createLoadingController<TranscriptionStep>();
  return await runWithLoadingUI<TranscriptionStep, TranscriptionResult>({
    controller,
    renderContent: (handlers) => (
      <TranscriptionProgressScreen
        mode={input.mode}
        audioPath={input.audioPath}
        languageCode={input.languageCode}
        onSuccess={handlers.onSuccess}
        onError={handlers.onError}
      />
    ),
  });
}

const LOCAL_TRANSCRIPTION_STEPS = [
  { id: "starting", label: "Preparing process" },
  { id: "loading_model", label: "Loading model" },
  { id: "transcribing", label: "Transcribing audio" },
  { id: "writing_output", label: "Saving transcript" },
  { id: "complete", label: "Completed" },
] satisfies ReadonlyArray<LoadingStep<TranscriptionStep>>;

const CLOUD_TRANSCRIPTION_STEPS = [
  { id: "starting", label: "Preparing process" },
  { id: "uploading_audio", label: "Uploading audio" },
  { id: "awaiting_provider", label: "Waiting for provider" },
  { id: "writing_output", label: "Saving transcript" },
  { id: "complete", label: "Completed" },
] satisfies ReadonlyArray<LoadingStep<TranscriptionStep>>;

type ProgressMode = "local" | "openai" | "deepgram";
type TranscriptionStep =
  | "starting"
  | "loading_model"
  | "transcribing"
  | "uploading_audio"
  | "awaiting_provider"
  | "writing_output"
  | "complete";

const COMPLETION_DELAY_MS = 500;
