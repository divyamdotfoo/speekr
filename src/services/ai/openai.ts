import { createReadStream } from "node:fs";
import OpenAI from "openai";
import type {
  AIProviderInterface,
  TranscriptionInput,
  TranscriptionOutput,
} from "../../types/index.ts";

export class OpenAIProvider implements AIProviderInterface {
  private readonly client: OpenAI;

  constructor(apiKey: string | null) {
    if (!apiKey) {
      throw new Error(
        "OpenAI API key is missing. Run `speekr setup` and add your OpenAI key."
      );
    }
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionOutput> {
    const response = await this.client.audio.transcriptions.create({
      model: "whisper-1",
      file: createReadStream(input.audioPath),
      language: input.languageCode,
    });

    return {
      text: response.text,
      language: input.languageCode ?? null,
    };
  }
}
