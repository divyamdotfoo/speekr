export type User = {
  id: string;
  name: string;
};

export type UserTrack = {
  id: string;
  userId: string;
  language: string;
  proficiency: ProficiencyLevel;
};

export type UserSession = {
  id: string;
  userId: string;
  userTrackId: string;
  transcriptText: string | null;
  audioDurationMs: number;
  audioFilePath: string;
  wordCount: number | null;
};

export type SupportedLanguage = {
  id: string;
  code: string;
  label: string;
};

export type Configuration = {
  openAIKey: string | null;
  anthropicKey: string | null;
  deepgramKey: string | null;
  defaultModel: AIProvider | null;
  transcriptionChoice: TranscriptionChoice;
};

// Stored as a numeric 1..10 rating. UI + DB CHECK constraint enforce bounds.
export type ProficiencyLevel = number;
export type TranscriptionChoice = "local" | "https" | null;

export type StopReason = "user" | "silence_timeout";

export type RecordSessionResult = {
  outputPath: string;
  durationMs: number;
  stopReason: StopReason;
};

export type RecordSession = {
  stop: (reason?: StopReason) => void;
  result: Promise<RecordSessionResult>;
  on: <K extends "silence-warning" | "silence-cleared">(
    event: K,
    listener: (
      payload: K extends "silence-warning"
        ? { secondsUntilAutoStop: number }
        : undefined
    ) => void
  ) => void;
  off: <K extends "silence-warning" | "silence-cleared">(
    event: K,
    listener: (
      payload: K extends "silence-warning"
        ? { secondsUntilAutoStop: number }
        : undefined
    ) => void
  ) => void;
};

export type LoadingProgressEvent = {
  step: string;
  message: string;
  percent: number | null;
  isIndeterminate?: boolean;
  stageLabel?: string;
  hint?: string;
};

export type TranscriptionResult = {
  text: string;
  language: string | null;
  transcriptPath: string;
};

export type AIProvider = "openai" | "anthropic" | "deepgram";

export type AIConfig = {
  provider: AIProvider;
  openAIKey?: string | null;
  anthropicKey?: string | null;
};

export type AIRequestParams = {
  provider?: AIProvider;
};

export type TranscriptionInput = {
  audioPath: string;
  languageCode?: string;
};

export type TranscriptionOutput = {
  text: string;
  language: string | null;
};

export interface AIProviderInterface {
  transcribe: (input: TranscriptionInput) => Promise<TranscriptionOutput>;
}
