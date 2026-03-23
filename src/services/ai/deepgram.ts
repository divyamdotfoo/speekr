import { readFile } from "node:fs/promises";
import type {
  AIProviderInterface,
  TranscriptionInput,
  TranscriptionOutput,
} from "../../types/index.ts";
import { getAudioContentTypeFromPath } from "../../lib/utils.ts";
import { createCaller } from "./utils.ts";

export class DeepgramProvider implements AIProviderInterface {
  private readonly caller: ReturnType<typeof createCaller>;

  constructor(apiKey: string | null) {
    const resolved = apiKey ?? process.env.DEEPGRAM_API_KEY ?? null;
    if (!resolved) {
      throw new Error(
        "Deepgram API key is missing. Set DEEPGRAM_API_KEY or wire it into Speekr config."
      );
    }
    this.caller = createCaller("deepgram", resolved);
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionOutput> {
    const audioBytes = await readFile(input.audioPath);
    const contentType = getAudioContentTypeFromPath(input.audioPath);

    const url = new URL("https://api.deepgram.com/v1/listen");
    url.searchParams.set("model", "nova-3");
    url.searchParams.set("smart_format", "true");
    if (input.languageCode) {
      url.searchParams.set("language", input.languageCode);
    }

    const responseJson = await this.caller<DeepgramListenResponse>(
      url.toString(),
      {
        body: audioBytes,
        headers: {
          "Content-Type": contentType,
        },
      }
    );

    const transcript =
      responseJson?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    if (typeof transcript !== "string" || !transcript.trim()) {
      throw new Error(
        `Deepgram transcription failed: missing transcript in response (${JSON.stringify(
          responseJson
        )}).`
      );
    }

    return {
      text: transcript,
      language: input.languageCode ?? null,
    };
  }
}

type DeepgramListenResponse = {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
      }>;
    }>;
  };
};
