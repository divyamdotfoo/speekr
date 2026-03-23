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
  afterTranscription?: (input: {
    result: TranscriptionResult;
    onProgress: (message: string, hint?: string) => void;
    onLog: (line: string) => void;
  }) => Promise<void>;
}) {
  return await runProgressScreen({
    mode: "local",
    audioPath: input.audioPath,
    languageCode: input.languageCode,
    afterTranscription: input.afterTranscription,
  });
}

export async function runOpenAITranscriptionProgressScreen(input: {
  audioPath: string;
  languageCode?: string;
  afterTranscription?: (input: {
    result: TranscriptionResult;
    onProgress: (message: string, hint?: string) => void;
    onLog: (line: string) => void;
  }) => Promise<void>;
}) {
  return await runProgressScreen({
    mode: "openai",
    audioPath: input.audioPath,
    languageCode: input.languageCode,
    afterTranscription: input.afterTranscription,
  });
}

export async function runDeepgramTranscriptionProgressScreen(input: {
  audioPath: string;
  languageCode?: string;
  afterTranscription?: (input: {
    result: TranscriptionResult;
    onProgress: (message: string, hint?: string) => void;
    onLog: (line: string) => void;
  }) => Promise<void>;
}) {
  return await runProgressScreen({
    mode: "deepgram",
    audioPath: input.audioPath,
    languageCode: input.languageCode,
    afterTranscription: input.afterTranscription,
  });
}

function TranscriptionProgressScreen(input: {
  mode: ProgressMode;
  audioPath: string;
  languageCode?: string;
  afterTranscription?: (input: {
    result: TranscriptionResult;
    onProgress: (message: string, hint?: string) => void;
    onLog: (line: string) => void;
  }) => Promise<void>;
  onSuccess: (result: TranscriptionResult) => void;
  onError: (error: Error) => void;
}) {
  const loading = useLoadingController<TranscriptionStep>();

  useEffect(() => {
    let isMounted = true;
    loading.showLoadingUI({
      title: "Transcribing recording",
      subtitle: "record",
      steps: TRANSCRIPTION_STEPS,
      initialStep: "preparing_process",
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
                step: mapTranscriptionProgressStep(event.step),
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
                step: mapTranscriptionProgressStep(event.step),
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
      .then(async (result) => {
        if (!isMounted) {
          return;
        }
        if (input.afterTranscription) {
          loading.updateLoadingUI({
            step: "generating_ai_feedback",
            message: "Generating AI feedback.",
          });
          await input.afterTranscription({
            result,
            onProgress(message, hint) {
              if (!isMounted) {
                return;
              }
              loading.updateLoadingUI({
                step: "generating_ai_feedback",
                message,
                hint,
              });
            },
            onLog(line) {
              if (!isMounted) {
                return;
              }
              loading.appendLoadingLog(line);
            },
          });
        }
        loading.completeLoadingUI({
          step: "complete",
          message: input.afterTranscription
            ? "Transcription and feedback complete."
            : "Transcription complete.",
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
  afterTranscription?: (input: {
    result: TranscriptionResult;
    onProgress: (message: string, hint?: string) => void;
    onLog: (line: string) => void;
  }) => Promise<void>;
}) {
  const runTranscription =
    input.mode === "local"
      ? transcribeRecordingLocally({
          audioPath: input.audioPath,
          languageCode: input.languageCode,
        })
      : transcribeRecordingWithAI({
          provider: input.mode,
          transcription: {
            audioPath: input.audioPath,
            languageCode: input.languageCode,
          },
        });

  if (!process.stdin.isTTY) {
    const result = await runTranscription;
    if (input.afterTranscription) {
      await input.afterTranscription({
        result,
        onProgress: () => undefined,
        onLog: () => undefined,
      });
    }
    return result;
  }

  const controller = createLoadingController<TranscriptionStep>();
  return await runWithLoadingUI<TranscriptionStep, TranscriptionResult>({
    controller,
    renderContent: (handlers) => (
      <TranscriptionProgressScreen
        mode={input.mode}
        audioPath={input.audioPath}
        languageCode={input.languageCode}
        afterTranscription={input.afterTranscription}
        onSuccess={handlers.onSuccess}
        onError={handlers.onError}
      />
    ),
  });
}

const TRANSCRIPTION_STEPS = [
  { id: "preparing_process", label: "Preparing process" },
  { id: "transcribing_audio", label: "Transcribing audio" },
  { id: "generating_ai_feedback", label: "Generating AI feedback" },
  { id: "complete", label: "Completed" },
] satisfies ReadonlyArray<LoadingStep<TranscriptionStep>>;

type ProgressMode = "local" | "openai" | "deepgram";
type TranscriptionStep =
  | "preparing_process"
  | "transcribing_audio"
  | "generating_ai_feedback"
  | "complete";

const COMPLETION_DELAY_MS = 500;

function mapTranscriptionProgressStep(step: string): TranscriptionStep {
  if (step === "complete") {
    return "complete";
  }
  if (step === "starting") {
    return "preparing_process";
  }
  return "transcribing_audio";
}
