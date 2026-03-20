import type {
  AIConfig,
  AIProvider,
  AIRequestParams,
  TranscriptionInput,
  TranscriptionOutput,
} from "../../types/index.ts";
import { getConfiguration } from "../../db/queries.ts";
import { AnthropicProvider } from "./anthropic.ts";
import { OpenAIProvider } from "./openai.ts";

type TranscriptionProvider = {
  transcribe: (input: TranscriptionInput) => Promise<TranscriptionOutput>;
};

export class AI {
  private readonly provider: TranscriptionProvider;

  constructor(config: AIConfig) {
    this.provider = loadProvider(config);
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionOutput> {
    return await this.provider.transcribe(input);
  }
}

export function getAI(params?: AIRequestParams) {
  const config = resolveAIConfig(params);
  const fingerprint = buildConfigFingerprint(config);

  if (!aiInstance || aiInstanceFingerprint !== fingerprint) {
    aiInstance = new AI(config);
    aiInstanceFingerprint = fingerprint;
  }

  return aiInstance;
}

function loadProvider(config: AIConfig): TranscriptionProvider {
  if (config.provider === "openai") {
    return new OpenAIProvider(config.openAIKey ?? null);
  }

  if (config.provider === "anthropic") {
    return new AnthropicProvider();
  }

  throw new Error(`Unsupported AI provider "${config.provider}".`);
}

function resolveAIConfig(params?: AIRequestParams): AIConfig {
  const configuration = getConfiguration();
  const requestedProvider = params?.provider;
  const provider = (requestedProvider ??
    configuration.defaultModel ??
    "openai") satisfies AIProvider;

  return {
    provider,
    openAIKey: configuration.openAIKey,
    anthropicKey: configuration.anthropicKey,
  };
}

function buildConfigFingerprint(config: AIConfig) {
  return `${config.provider}|${config.openAIKey ?? ""}|${
    config.anthropicKey ?? ""
  }`;
}

let aiInstance: AI | null = null;
let aiInstanceFingerprint: string | null = null;
