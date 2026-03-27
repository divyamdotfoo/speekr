import type { SupportedLanguage } from "../types/index.ts";

export const TRANSCRIPTION_DEFAULT_MODEL = "base";

export const LOG_PANEL_LINES = 6;

export const AUDIO_RECORDING_CONFIG = {
  channels: "1",
  sampleRate: "16000",
  codec: "pcm_s16le",
  silenceThresholdDb: -18,
  silenceDurationSec: 0.5,
  rejectVolumeBelowDb: -45,
} as const;

export const AUDIO_INPUT_DEFAULTS = {
  darwin: ":1",
  win32: 'audio="Microphone"',
  linux: "default",
} as const;

export const SUPPORTED_LANGUAGES: Array<
  Pick<SupportedLanguage, "code" | "label">
> = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "ru", label: "Russian" },
  { code: "tr", label: "Turkish" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ko", label: "Korean" },
  { code: "hi", label: "Hindi" },
  { code: "sv", label: "Swedish" },
  { code: "no", label: "Norwegian" },
  { code: "da", label: "Danish" },
  { code: "fi", label: "Finnish" },
  { code: "el", label: "Greek" },
  { code: "cs", label: "Czech" },
  { code: "hu", label: "Hungarian" },
];
