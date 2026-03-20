import { writeFile } from "node:fs/promises";
import { getAI } from "../ai/index.ts";
import type {
  TranscriptionInput,
  TranscriptionResult,
} from "../../types/index.ts";

export async function transcribeRecordingWithAI(input: {
  transcription: TranscriptionInput;
}) {
  const ai = getAI();

  const result = await ai.transcribe(input.transcription);
  const transcriptPath = toTranscriptPath(input.transcription.audioPath);

  await writeFile(transcriptPath, result.text, "utf8");

  return {
    text: result.text,
    language: result.language,
    transcriptPath,
  } satisfies TranscriptionResult;
}

function toTranscriptPath(audioPath: string) {
  return audioPath.replace(/\.[^/.]+$/, ".txt");
}
