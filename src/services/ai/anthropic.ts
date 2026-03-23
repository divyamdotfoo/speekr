import type {
  AIProviderInterface,
  FeedbackInput,
  SessionFeedback,
  TranscriptionInput,
  TranscriptionOutput,
} from "../../types/index.ts";
import { buildFeedbackPrompt, createCaller, parseSessionFeedback } from "./utils.ts";

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

  async generateFeedback(input: FeedbackInput): Promise<SessionFeedback> {
    const response = await this.caller<AnthropicResponse>(
      "https://api.anthropic.com/v1/messages",
      {
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 1800,
          messages: [{ role: "user", content: buildFeedbackPrompt(input) }],
        }),
        headers: {
          "content-type": "application/json",
        },
      }
    );

    const contentBlock = response.content?.find((item) => item.type === "text");
    const text = contentBlock?.text;
    if (!text?.trim()) {
      throw new Error("Anthropic feedback response was empty.");
    }
    return parseSessionFeedback(text);
  }
}

type AnthropicResponse = {
  content?: Array<{
    type: string;
    text?: string;
  }>;
};
