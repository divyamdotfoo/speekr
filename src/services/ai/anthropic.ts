import type { TranscriptionInput, TranscriptionOutput } from "../../types/index.ts";

export class AnthropicProvider {
  async transcribe(_input: TranscriptionInput): Promise<TranscriptionOutput> {
    throw new Error('Transcription is not supported by "anthropic" provider.');
  }
}
