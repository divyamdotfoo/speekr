import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProviderInterface,
  TranscriptionInput,
  TranscriptionOutput,
} from "../../types/index.ts";

export class AnthropicProvider implements AIProviderInterface {
  private readonly client: Anthropic;

  constructor(apiKey: string | null) {
    if (!apiKey) {
      throw new Error(
        "Anthropic API key is missing. Run `speekr setup` and add your Anthropic key."
      );
    }
    this.client = new Anthropic({ apiKey: apiKey });
  }

  async transcribe(_input: TranscriptionInput): Promise<TranscriptionOutput> {
    throw new Error(
      "Transcription is not supported by the Anthropic provider. Update the transcription choice in the configuration. Run `speekr config` to update the transcription choice."
    );
  }
}
