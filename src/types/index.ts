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
};

export type SupportedLanguage = {
  id: string;
  code: string;
  label: string;
};

export type Configuration = {
  openAIKey: string | null;
  anthropicKey: string | null;
  transcriptionChoice: TranscriptionChoice;
};

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced";
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
      payload: K extends "silence-warning" ? { secondsUntilAutoStop: number } : undefined,
    ) => void,
  ) => void;
  off: <K extends "silence-warning" | "silence-cleared">(
    event: K,
    listener: (
      payload: K extends "silence-warning" ? { secondsUntilAutoStop: number } : undefined,
    ) => void,
  ) => void;
};

export type RuntimeSetupStep =
  | "checking"
  | "creating_venv"
  | "upgrading_pip"
  | "installing_packages"
  | "complete";

export type RuntimeSetupEvent = {
  step: RuntimeSetupStep;
  message: string;
  progressBar: string;
  percent: number | null;
  isIndeterminate?: boolean;
  stageLabel?: string;
  hint?: string;
};

export type TranscriptionProgressStep =
  | "starting"
  | "loading_model"
  | "transcribing"
  | "writing_output"
  | "complete";

export type TranscriptionProgressEvent = {
  step: TranscriptionProgressStep;
  message: string;
  progressBar: string;
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
