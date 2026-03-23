import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { render } from "ink";
import { createElement } from "react";
import { renderCommandScreen } from "../../components/layout/command-screen.tsx";
import { runTranscriptionChoiceScreen } from "../../components/recording/transcription-choice-screen.tsx";
import {
  runDeepgramTranscriptionProgressScreen,
  runOpenAITranscriptionProgressScreen,
  runTranscriptionProgressScreen,
} from "../../components/recording/transcription-progress-screen.tsx";
import { renderRecordingSavedScreen } from "../../components/recording/recording-saved-screen.tsx";
import { RecordingSessionScreen } from "../../components/recording/recording-session-screen.tsx";
import {
  createUserSession,
  getPrimaryUser,
  getPrimaryUserTrack,
  getTranscriptionChoice,
  setTranscriptionChoice,
} from "../../db/queries.ts";
import {
  createRecordSession,
  getFfmpegInstallInstructions,
  getRecordingQualitySummary,
  resolveFfmpegExecutable as resolveAudioFfmpegExecutable,
} from "../../services/recording/index.ts";
import { RECORDINGS_DIRECTORY_PATH } from "../../db/client.ts";
import type { RecordSessionResult, TranscriptionChoice } from "../../types/index.ts";

export function resolveFfmpegExecutable() {
  return resolveAudioFfmpegExecutable();
}

export function showMissingFfmpegNotice() {
  const instructions = getFfmpegInstallInstructions();
  const formatted = instructions.map((line) => `- ${line}`).join("\n");
  renderCommandScreen({
    title: "ffmpeg not found",
    subtitle: "record",
    tone: "warning",
    statusLabel: "Dependency required",
    message: `Install ffmpeg and retry:\n${formatted}`,
  });
}

export async function runInteractiveRecording(
  ffmpegPath: string,
  input?: { transcription?: Exclude<TranscriptionChoice, null> }
) {
  await mkdir(RECORDINGS_DIRECTORY_PATH, { recursive: true });
  const outputPath = join(RECORDINGS_DIRECTORY_PATH, buildRecordingFileName());
  const session = createRecordSession({
    ffmpegPath,
    outputPath,
  });

  const result = await new Promise<RecordSessionResult>((resolve, reject) => {
    const instance = render(createElement(RecordingSessionScreen, { session }));
    session.result
      .then((value) => {
        instance.unmount();
        resolve(value);
      })
      .catch((error) => {
        instance.unmount();
        reject(error);
      });
  });

  const primaryUser = getPrimaryUser();
  const primaryTrack = primaryUser
    ? getPrimaryUserTrack(primaryUser.id)
    : null;
  const languageCode = primaryTrack?.language;
  const transcriptionChoice =
    input?.transcription ?? (await resolveTranscriptionChoiceAfterRecording());
  if (transcriptionChoice === null) {
    if (primaryUser && primaryTrack) {
      try {
        tryPersistUserSession({
          userId: primaryUser.id,
          userTrackId: primaryTrack.id,
          transcriptText: null,
          audioDurationMs: result.durationMs,
          audioFilePath: result.outputPath,
          wordCount: null,
        });
      } catch {
        // Intentionally ignore: recording should not be blocked by DB writes.
      }
    }

    renderRecordingSavedScreen({
      outputPath: result.outputPath,
      statusLabel:
        result.stopReason === "silence_timeout"
          ? "Stopped after prolonged silence"
          : "Capture complete",
      qualitySummary: getRecordingQualitySummary(),
      transcriptPath: undefined,
      transcriptionStatus: "Skipped: transcription mode not selected.",
    });
    return;
  }

  let transcriptPath: string | undefined;
  let transcriptionStatus = "Skipped";
  let transcriptText: string | null = null;
  let wordCount: number | null = null;
  try {
    const transcript =
      transcriptionChoice === "local"
        ? await runTranscriptionProgressScreen({
            audioPath: result.outputPath,
            languageCode,
          })
        : transcriptionChoice === "openai"
          ? await runOpenAITranscriptionProgressScreen({
              audioPath: result.outputPath,
              languageCode,
            })
          : await runDeepgramTranscriptionProgressScreen({
              audioPath: result.outputPath,
              languageCode,
            });
    transcriptPath = transcript.transcriptPath;
    transcriptText = transcript.text;
    wordCount = countWords(transcript.text);
    transcriptionStatus = `Completed${
      transcript.language ? ` (${transcript.language})` : ""
    }`;
  } catch (error) {
    transcriptionStatus = `Failed: ${
      error instanceof Error ? error.message : "Unknown error."
    }`;
  }

  if (primaryUser && primaryTrack) {
    try {
      tryPersistUserSession({
        userId: primaryUser.id,
        userTrackId: primaryTrack.id,
        transcriptText,
        audioDurationMs: result.durationMs,
        audioFilePath: result.outputPath,
        wordCount,
      });
    } catch {
      // Intentionally ignore: recording should not be blocked by DB writes.
    }
  }

  renderRecordingSavedScreen({
    outputPath: result.outputPath,
    statusLabel:
      result.stopReason === "silence_timeout"
        ? "Stopped after prolonged silence"
        : "Capture complete",
    qualitySummary: getRecordingQualitySummary(),
    transcriptPath,
    transcriptionStatus,
  });
}

function buildRecordingFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `recording-${stamp}.wav`;
}

async function resolveTranscriptionChoiceAfterRecording() {
  const current = getTranscriptionChoice();
  if (current) {
    return current;
  }

  const selected = await runTranscriptionChoiceScreen();
  if (!selected) {
    return null;
  }
  setTranscriptionChoice(selected);
  return selected;
}

function tryPersistUserSession(input: {
  userId: string;
  userTrackId: string;
  transcriptText: string | null;
  audioDurationMs: number;
  audioFilePath: string;
  wordCount: number | null;
}) {
  createUserSession(input);
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}
