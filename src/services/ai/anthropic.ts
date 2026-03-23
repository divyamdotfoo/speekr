import type {
  AIProviderInterface,
  TranscriptionInput,
  TranscriptionOutput,
} from "../../types/index.ts";
import { createCaller } from "./utils.ts";

export class AnthropicProvider implements AIProviderInterface {
  private readonly caller: ReturnType<typeof createCaller>;

  constructor(apiKey: string | null) {
    const resolved = apiKey ?? process.env.ANTHROPIC_API_KEY ?? null;
    if (!resolved) {
      throw new Error(
        "Anthropic API key is missing. Run `speekr setup` and add your Anthropic key."
      );
    }
    this.caller = createCaller("anthropic", resolved);
  }

  async transcribe(_input: TranscriptionInput): Promise<TranscriptionOutput> {
    throw new Error(
      "Transcription is not supported by the Anthropic provider. Update the transcription choice in the configuration. Run `speekr config` to update the transcription choice."
    );
  }
}
