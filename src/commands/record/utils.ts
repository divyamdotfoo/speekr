import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { render } from "ink";
import { createElement } from "react";
import { renderCommandScreen } from "../../components/layout/command-screen.tsx";
import { runTranscriptionChoiceScreen } from "../../components/recording/transcription-choice-screen.tsx";
import {
  runHTTPSTranscriptionProgressScreen,
  runTranscriptionProgressScreen,
} from "../../components/recording/transcription-progress-screen.tsx";
import { renderRecordingSavedScreen } from "../../components/recording/recording-saved-screen.tsx";
import { RecordingSessionScreen } from "../../components/recording/recording-session-screen.tsx";
import {
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

  const languageCode = resolvePreferredLanguageCode();
  const transcriptionChoice =
    input?.transcription ?? (await resolveTranscriptionChoiceAfterRecording());
  if (transcriptionChoice === null) {
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
  try {
    const transcript =
      transcriptionChoice === "local"
        ? await runTranscriptionProgressScreen({
            audioPath: result.outputPath,
            languageCode,
          })
        : await runHTTPSTranscriptionProgressScreen({
            audioPath: result.outputPath,
            languageCode,
          });
    transcriptPath = transcript.transcriptPath;
    transcriptionStatus = `Completed${
      transcript.language ? ` (${transcript.language})` : ""
    }`;
  } catch (error) {
    transcriptionStatus = `Failed: ${
      error instanceof Error ? error.message : "Unknown error."
    }`;
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

function resolvePreferredLanguageCode() {
  const primaryUser = getPrimaryUser();
  if (!primaryUser) {
    return undefined;
  }
  const track = getPrimaryUserTrack(primaryUser.id);
  return track?.language;
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
