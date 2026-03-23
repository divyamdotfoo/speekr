import { writeFile } from "node:fs/promises";
import { getAI } from "../ai/index.ts";
import type {
  LoadingProgressEvent,
  TranscriptionInput,
  TranscriptionResult,
} from "../../types/index.ts";

export async function transcribeRecordingWithAI(input: {
  transcription: TranscriptionInput;
  provider: "openai" | "deepgram";
  onEvent?: (event: LoadingProgressEvent) => void;
  onLog?: (line: string) => void;
}) {
  const providerLabel = input.provider === "openai" ? "OpenAI" : "Deepgram";

  input.onEvent?.({
    step: "starting",
    message: "Preparing cloud transcription process.",
    percent: null,
    isIndeterminate: true,
    stageLabel: "Preparing process",
  });
  input.onLog?.(`Preparing ${providerLabel} transcription.`);

  input.onEvent?.({
    step: "uploading_audio",
    message: `Uploading audio to ${providerLabel}.`,
    percent: null,
    isIndeterminate: true,
    stageLabel: "Uploading audio",
    hint: "Upload duration depends on file size and network speed.",
  });
  input.onLog?.(`Uploading audio file to ${providerLabel} API.`);

  const ai = getAI({ provider: input.provider });
  const startedAt = Date.now();
  const heartbeat = setInterval(() => {
    const elapsed = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    input.onEvent?.({
      step: "awaiting_provider",
      message: `Waiting for ${providerLabel} to finish transcription.`,
      percent: null,
      isIndeterminate: true,
      stageLabel: "Awaiting provider",
      hint: `Elapsed ${elapsed}s.`,
    });
  }, 1000);

  try {
    const result = await ai.transcribe(input.transcription);
    clearInterval(heartbeat);
    input.onLog?.(`${providerLabel} returned a transcription response.`);

    const transcriptPath = toTranscriptPath(input.transcription.audioPath);
    input.onEvent?.({
      step: "writing_output",
      message: "Saving transcript to disk.",
      percent: 90,
      isIndeterminate: false,
      stageLabel: "Saving transcript",
    });
    await writeFile(transcriptPath, result.text, "utf8");
    input.onLog?.(`Saved transcript file: ${transcriptPath}`);
    input.onEvent?.({
      step: "complete",
      message: "Cloud transcription completed successfully.",
      percent: 100,
      isIndeterminate: false,
      stageLabel: "Completed",
    });

    return {
      text: result.text,
      language: result.language,
      transcriptPath,
    } satisfies TranscriptionResult;
  } finally {
    clearInterval(heartbeat);
  }
}

function toTranscriptPath(audioPath: string) {
  return audioPath.replace(/\.[^/.]+$/, ".txt");
}
