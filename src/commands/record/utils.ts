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
  getTrackGrammarPatternTypes,
  getTrackVocabularyWords,
  getPrimaryUser,
  getPrimaryUserTrack,
  getTranscriptionChoice,
  markSessionFeedbackFailed,
  saveSessionFeedback,
  setTranscriptionChoice,
} from "../../db/queries.ts";
import {
  createRecordSession,
  getFfmpegInstallInstructions,
  resolveFfmpegExecutable as resolveAudioFfmpegExecutable,
} from "../../services/recording/index.ts";
import { getAI } from "../../services/ai/index.ts";
import { RECORDINGS_DIRECTORY_PATH } from "../../db/client.ts";
import type {
  RecordSessionResult,
  SessionFeedback,
  TranscriptionChoice,
  UserSession,
} from "../../types/index.ts";

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
  const primaryTrack = primaryUser ? getPrimaryUserTrack(primaryUser.id) : null;
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
      recordingStatusLabel:
        result.stopReason === "silence_timeout"
          ? "Stopped after prolonged silence"
          : "Capture complete",
      recordingDurationMs: result.durationMs,
      progressStatusLabel:
        "Skipped: transcription mode not selected for this recording.",
      spokenText: null,
      feedback: null,
      feedbackError:
        "Transcription was skipped because no transcription mode was selected.",
    });
    return;
  }

  let transcriptText: string | null = null;
  let wordCount: number | null = null;
  let feedback: SessionFeedback | null = null;
  let feedbackError: string | null = null;
  let persistedSession: UserSession | null = null;
  try {
    const transcriptionAndFeedback = await runTranscriptionAndFeedback({
      transcriptionChoice,
      audioPath: result.outputPath,
      languageCode,
      userTrackId: primaryTrack?.id,
      proficiency: primaryTrack?.proficiency,
    });
    transcriptText = transcriptionAndFeedback.transcript.text;
    wordCount = countWords(transcriptionAndFeedback.transcript.text);
    feedback = transcriptionAndFeedback.feedback;
    feedbackError = transcriptionAndFeedback.feedbackError;
  } catch (error) {
    feedbackError = `Transcription failed: ${
      error instanceof Error ? error.message : "Unknown error."
    }`;
  }

  if (primaryUser && primaryTrack) {
    try {
      persistedSession = tryPersistUserSession({
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

  if (persistedSession && feedback) {
    try {
      saveSessionFeedback({
        userSessionId: persistedSession.id,
        userTrackId: persistedSession.userTrackId,
        feedback,
      });
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message
          : "Unknown feedback persistence error.";
      feedbackError = `AI feedback failed: ${detail}`;
      try {
        markSessionFeedbackFailed({
          userSessionId: persistedSession.id,
          errorMessage: detail,
        });
      } catch {
        // Intentionally ignore: post-record summary should still be shown.
      }
    }
  } else if (persistedSession && feedbackError) {
    try {
      markSessionFeedbackFailed({
        userSessionId: persistedSession.id,
        errorMessage: feedbackError,
      });
    } catch {
      // Intentionally ignore: post-record summary should still be shown.
    }
  }

  renderRecordingSavedScreen({
    recordingStatusLabel:
      result.stopReason === "silence_timeout"
        ? "Stopped after prolonged silence"
        : "Capture complete",
    recordingDurationMs: result.durationMs,
    progressStatusLabel:
      feedbackError ??
      (feedback
        ? "Transcription and AI feedback completed."
        : "Transcription completed."),
    spokenText: transcriptText,
    feedback,
    feedbackError,
  });
}

async function runTranscriptionAndFeedback(input: {
  transcriptionChoice: Exclude<TranscriptionChoice, null>;
  audioPath: string;
  languageCode?: string;
  userTrackId?: string;
  proficiency?: number;
}): Promise<{
  transcript: { text: string; language: string | null };
  feedback: SessionFeedback | null;
  feedbackError: string | null;
}> {
  let generatedFeedback: SessionFeedback | null = null;
  let feedbackError: string | null = null;

  const afterTranscription = async (feedbackInput: {
    result: { text: string; language: string | null };
    onProgress: (message: string, hint?: string) => void;
    onLog: (line: string) => void;
  }) => {
    if (!input.userTrackId) {
      feedbackError = "AI feedback skipped: no user track available.";
      return;
    }
    try {
      feedbackInput.onProgress(
        "Preparing existing context for prompt.",
        "Using saved vocabulary and grammar patterns from this track."
      );
      feedbackInput.onLog("Preparing AI feedback context.");
      const existingVocabularyWords = getTrackVocabularyWords(input.userTrackId);
      const existingGrammarPatternTypes = getTrackGrammarPatternTypes(
        input.userTrackId
      );
      const ai = getAI();
      feedbackInput.onProgress("Waiting for AI provider feedback response.");
      feedbackInput.onLog("Sending transcription for AI feedback analysis.");
      generatedFeedback = await ai.generateFeedback({
        transcription: feedbackInput.result.text,
        existingVocabularyWords,
        existingGrammarPatternTypes,
        proficiency: input.proficiency ?? 0,
      });
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message
          : "Unknown feedback generation error.";
      feedbackError = `AI feedback failed: ${detail}`;
    }
  };

  const transcript =
    input.transcriptionChoice === "local"
      ? await runTranscriptionProgressScreen({
          audioPath: input.audioPath,
          languageCode: input.languageCode,
          afterTranscription,
        })
      : input.transcriptionChoice === "openai"
      ? await runOpenAITranscriptionProgressScreen({
          audioPath: input.audioPath,
          languageCode: input.languageCode,
          afterTranscription,
        })
      : await runDeepgramTranscriptionProgressScreen({
          audioPath: input.audioPath,
          languageCode: input.languageCode,
          afterTranscription,
        });

  return { transcript, feedback: generatedFeedback, feedbackError };
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
  return createUserSession(input);
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}
