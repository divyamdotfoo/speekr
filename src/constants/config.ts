import type { TranscriptionChoice } from "../types/index.ts";

export const TRANSCRIPTION_CONFIG = {
  defaultModel: "base",
  localModelName: "base",
  localModelDownloadSizeLabel: "~150MB",
  firstRunDurationLabel: "1-2 minutes",
  subsequentRunDurationLabel: "a few seconds",
  localChoiceDescription:
    "free, private, offline",
  httpsChoiceDescription:
    "requires OpenAI API key over HTTPS (not implemented yet)",
} as const;

export const TRANSCRIPTION_CHOICES: Array<{
  value: Exclude<TranscriptionChoice, null>;
  label: string;
  description: string;
}> = [
  {
    value: "local",
    label:
      `Local : (${TRANSCRIPTION_CONFIG.localChoiceDescription}, cost: free, first run: ${TRANSCRIPTION_CONFIG.firstRunDurationLabel}, later: ${TRANSCRIPTION_CONFIG.subsequentRunDurationLabel})`,
    description: `Downloads ${TRANSCRIPTION_CONFIG.localModelName} model ${TRANSCRIPTION_CONFIG.localModelDownloadSizeLabel} once.`,
  },
  {
    value: "https",
    label:
      `HTTPS : (${TRANSCRIPTION_CONFIG.httpsChoiceDescription}, cost: paid API usage, first run: immediate after key setup, later: network-dependent)`,
    description: "You can switch to this path once HTTPS transcription support is added.",
  },
];

export const AUDIO_RECORDING_CONFIG = {
  channels: "1",
  sampleRate: "48000",
  codec: "pcm_s16le",
  silenceFilter: "silencedetect=noise=-35dB:d=1",
  inputDevice: null as string | null,
} as const;
