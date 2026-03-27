import type {
  AIConfig,
  AIProvider,
  AIProviderInterface,
  AIRequestParams,
} from "../../types/index.ts";
import { config } from "../../db/queries/index.ts";
import { AnthropicProvider } from "./anthropic.ts";
import { DeepgramProvider } from "./deepgram.ts";
import { OpenAIProvider } from "./openai.ts";

let aiInstance: AIProviderInterface | null = null;
let aiInstanceFingerprint: string | null = null;

export function getAI(params?: AIRequestParams): AIProviderInterface {
  const config = resolveAIConfig(params);
  const fingerprint = buildConfigFingerprint(config);

  if (!aiInstance || aiInstanceFingerprint !== fingerprint) {
    aiInstance = loadProvider(config);
    aiInstanceFingerprint = fingerprint;
  }

  return aiInstance;
}

function loadProvider(config: AIConfig): AIProviderInterface {
  if (config.provider === "openai") {
    return new OpenAIProvider(config.openAIKey ?? null);
  }

  if (config.provider === "anthropic") {
    return new AnthropicProvider(config.anthropicKey ?? null);
  }

  if (config.provider === "deepgram") {
    return new DeepgramProvider(config.deepgramKey ?? null);
  }

  throw new Error(`Unsupported AI provider "${config.provider}".`);
}

function resolveAIConfig(params?: AIRequestParams): AIConfig {
  const configuration = config.getConfiguration();
  const requestedProvider = params?.provider;
  const provider = (requestedProvider ??
    configuration.defaultModel ??
    "openai") satisfies AIProvider;

  return {
    provider,
    openAIKey: configuration.openAIKey,
    anthropicKey: configuration.anthropicKey,
    deepgramKey: configuration.deepgramKey,
  };
}

function buildConfigFingerprint(config: AIConfig) {
  return `${config.provider}|${config.openAIKey ?? ""}|${
    config.anthropicKey ?? ""
  }|${config.deepgramKey ?? ""}`;
}
