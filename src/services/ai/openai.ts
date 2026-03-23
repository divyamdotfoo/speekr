import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type {
  AIProviderInterface,
  FeedbackInput,
  SessionFeedback,
  TranscriptionInput,
  TranscriptionOutput,
} from "../../types/index.ts";
import { getAudioContentTypeFromPath } from "../../lib/utils.ts";
import { buildFeedbackPrompt, createCaller, parseSessionFeedback } from "./utils.ts";

export class OpenAIProvider implements AIProviderInterface {
  private readonly caller: ReturnType<typeof createCaller>;

  constructor(apiKey: string | null) {
    if (!apiKey) {
      throw new Error(
        "OpenAI API key is missing. Run `speekr setup` and add your OpenAI key."
      );
    }
    this.caller = createCaller("openai", apiKey);
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionOutput> {
    const model = "gpt-4o-mini-transcribe";
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([await readFile(input.audioPath)], {
        type: getAudioContentTypeFromPath(input.audioPath),
      }),
      basename(input.audioPath)
    );
    formData.append("model", model);
    formData.append("response_format", "json");
    if (input.languageCode) {
      formData.append("language", input.languageCode);
    }

    const responseJson = await this.caller<OpenAITranscriptionResponse>(
      "https://api.openai.com/v1/audio/transcriptions",
      { body: formData }
    );

    const text =
      typeof responseJson.text === "string" ? responseJson.text : null;
    if (!text) {
      throw new Error(
        `OpenAI transcription failed: missing 'text' in response (${JSON.stringify(
          responseJson
        )}).`
      );
    }

    return {
      text,
      language: input.languageCode ?? null,
    };
  }

  async generateFeedback(input: FeedbackInput): Promise<SessionFeedback> {
    const response = await this.caller<OpenAIResponse>(
      "https://api.openai.com/v1/chat/completions",
      {
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a language coach that always returns strict JSON only.",
            },
            {
              role: "user",
              content: buildFeedbackPrompt(input),
            },
          ],
        }),
        headers: {
          "content-type": "application/json",
        },
      }
    );

    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("OpenAI feedback response was empty.");
    }
    return parseSessionFeedback(content);
  }
}

type OpenAITranscriptionResponse = {
  text?: unknown;
};

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};
