import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Box, Text, render, useInput } from "ink";
import SelectInput from "ink-select-input";
import { createElement } from "react";
import { AppFrame } from "../../components/layout/app-frame.tsx";
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
  listTopicSuggestionsForTrack,
  getTrackVocabularyWords,
  listUserTracksByUserId,
  getPrimaryUser,
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
  Topic,
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
  const primaryUser = getPrimaryUser();
  const userTracks = primaryUser ? listUserTracksByUserId(primaryUser.id) : [];
  const selectedTrack =
    userTracks.length <= 1
      ? userTracks[0] ?? null
      : await runTrackChoiceScreen(userTracks);
  const selectedTopic = selectedTrack
    ? await runTopicChoiceScreen({
        userTrackId: selectedTrack.id,
        proficiency: selectedTrack.proficiency,
      })
    : null;
  if (selectedTrack && selectedTopic === undefined) {
    return;
  }
  const languageCode = selectedTrack?.language;
  const currentLevelMeta = selectedTrack
    ? `Level ${selectedTrack.proficiency} · ${selectedTrack.languageLabel}`
    : undefined;

  await mkdir(RECORDINGS_DIRECTORY_PATH, { recursive: true });
  const outputPath = join(RECORDINGS_DIRECTORY_PATH, buildRecordingFileName());
  const session = createRecordSession({
    ffmpegPath,
    outputPath,
  });

  const result = await new Promise<RecordSessionResult>((resolve, reject) => {
    const instance = render(
      createElement(RecordingSessionScreen, {
        session,
        meta: currentLevelMeta,
        topicTitle: selectedTopic?.title,
        topicDescription: selectedTopic?.description,
      })
    );
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
  const transcriptionChoice =
    input?.transcription ?? (await resolveTranscriptionChoiceAfterRecording());
  if (transcriptionChoice === null) {
    if (primaryUser && selectedTrack) {
      try {
        tryPersistUserSession({
          userId: primaryUser.id,
          userTrackId: selectedTrack.id,
          topicId: selectedTopic?.id ?? null,
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
      recordingStatusLabel: "Capture complete",
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
  const transcriptionAndFeedback = await runTranscriptionAndFeedback({
    transcriptionChoice,
    audioPath: result.outputPath,
    languageCode,
    userTrackId: selectedTrack?.id,
    proficiency: selectedTrack?.proficiency,
  });
  transcriptText = transcriptionAndFeedback.transcript.text;
  wordCount = countWords(transcriptionAndFeedback.transcript.text);
  feedback = transcriptionAndFeedback.feedback;
  feedbackError = transcriptionAndFeedback.feedbackError;

  if (primaryUser && selectedTrack) {
    try {
      persistedSession = tryPersistUserSession({
        userId: primaryUser.id,
        userTrackId: selectedTrack.id,
        topicId: selectedTopic?.id ?? null,
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
    recordingStatusLabel: "Capture complete",
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
      throw new Error("AI feedback failed: no user track available.");
    }
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

async function runTrackChoiceScreen(
  tracks: Array<{
    id: string;
    language: string;
    languageLabel: string;
    proficiency: number;
  }>
) {
  if (tracks.length === 0) {
    return null;
  }

  return await new Promise<(typeof tracks)[number] | null>((resolve) => {
    const instance = render(
      createElement(TrackChoiceScreen, {
        tracks,
        onSelect: (track: (typeof tracks)[number]) => {
          instance.unmount();
          resolve(track);
        },
        onCancel: () => {
          instance.unmount();
          resolve(null);
        },
      })
    );
  });
}

async function runTopicChoiceScreen(input: {
  userTrackId: string;
  proficiency: number;
}): Promise<Topic | null | undefined> {
  const suggestions = listTopicSuggestionsForTrack({
    userTrackId: input.userTrackId,
    proficiency: input.proficiency,
    limit: 6,
  });
  return await new Promise<Topic | null | undefined>((resolve) => {
    const instance = render(
      createElement(TopicChoiceScreen, {
        suggestions,
        proficiency: input.proficiency,
        onSelect: (topic: Topic | null) => {
          instance.unmount();
          resolve(topic);
        },
        onCancel: () => {
          instance.unmount();
          resolve(undefined);
        },
      })
    );
  });
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
  topicId: string | null;
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

function TrackChoiceScreen({
  tracks,
  onSelect,
  onCancel,
}: {
  tracks: Array<{
    id: string;
    language: string;
    languageLabel: string;
    proficiency: number;
  }>;
  onSelect: (track: {
    id: string;
    language: string;
    languageLabel: string;
    proficiency: number;
  }) => void;
  onCancel: () => void;
}) {
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      onCancel();
    }
  });

  const trackById = new Map(tracks.map((track) => [track.id, track]));

  return createElement(
    AppFrame,
    { title: "Choose language track", subtitle: "record" },
    createElement(
      Box,
      { marginBottom: 1, flexDirection: "column" },
      createElement(
        Text,
        null,
        "Select the language track for this recording session."
      ),
      createElement(
        Text,
        null,
        "Your selected track is used for session history and feedback context."
      )
    ),
    createElement(
      Box,
      { marginTop: 1 },
      createElement(SelectInput, {
        items: tracks.map((track) => ({
          label: `${track.languageLabel} (Level ${track.proficiency})`,
          value: track.id,
        })),
        onSelect: (item: { value: unknown }) => {
          const matchedTrack = trackById.get(String(item.value));
          if (!matchedTrack) {
            return;
          }
          onSelect(matchedTrack);
        },
      })
    )
  );
}

function TopicChoiceScreen({
  suggestions,
  proficiency,
  onSelect,
  onCancel,
}: {
  suggestions: Topic[];
  proficiency: number;
  onSelect: (topic: Topic | null) => void;
  onCancel: () => void;
}) {
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      onCancel();
    }
  });

  const topicById = new Map(suggestions.map((topic) => [topic.id, topic]));

  return createElement(
    AppFrame,
    {
      title: "Choose topic",
      subtitle: "record",
      meta: `Level ${proficiency}`,
    },
    createElement(
      Box,
      { marginBottom: 1, flexDirection: "column" },
      createElement(
        Text,
        null,
        "Pick a guided topic or choose Freestyle to speak on anything."
      ),
      createElement(
        Text,
        null,
        "Used topics are excluded from suggestions for this track."
      )
    ),
    createElement(
      Box,
      { marginTop: 1 },
      createElement(SelectInput, {
        items: [
          {
            label: "Freestyle - speak about anything",
            value: "__freestyle__",
          },
          ...suggestions.map((topic) => ({
            label: `${topic.title} (L${topic.proficiency}) - ${topic.description}`,
            value: topic.id,
          })),
        ],
        onSelect: (item: { value: unknown }) => {
          const value = String(item.value);
          if (value === "__freestyle__") {
            onSelect(null);
            return;
          }
          const matchedTopic = topicById.get(value);
          if (!matchedTopic) {
            return;
          }
          onSelect(matchedTopic);
        },
      })
    )
  );
}
