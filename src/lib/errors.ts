export function formatUserFacingError(input: unknown): {
  title: string;
  statusLabel: string;
  message: string;
} {
  const rawMessage =
    input instanceof Error ? input.message : typeof input === "string" ? input : "Unknown error.";
  const message = rawMessage.trim();
  const lower = message.toLowerCase();
  const providerLabel = resolveProviderLabel(input, lower);

  if (
    lower.includes("invalid_auth") ||
    lower.includes("invalid credentials") ||
    lower.includes("401") ||
    hasStatus(input, 401)
  ) {
    return {
      title: `${providerLabel} authentication failed`,
      statusLabel: "Invalid API credentials",
      message:
        `Your ${providerLabel} API key was rejected. Run \`speekr setup\`, update the key, and retry.`,
    };
  }

  if (lower.includes("api key is missing") || lower.includes("set ") || lower.includes("missing")) {
    return {
      title: `${providerLabel} API key missing`,
      statusLabel: "Configuration required",
      message: "Add the required API key in `speekr setup` before running this command.",
    };
  }

  if (lower.includes("timed out") || lower.includes("network") || lower.includes("fetch failed")) {
    return {
      title: "Network request failed",
      statusLabel: "Provider unreachable",
      message:
        "Speekr could not reach the AI provider. Check your internet connection and retry in a moment.",
    };
  }

  return {
    title: `${providerLabel} request failed`,
    statusLabel: "Unexpected error",
    message: "Something went wrong while contacting the provider. Please retry, or update your settings in `speekr setup`.",
  };
}

function hasStatus(input: unknown, status: number) {
  if (!input || typeof input !== "object") {
    return false;
  }
  const value = (input as { status?: unknown }).status;
  return value === status;
}

function resolveProviderLabel(input: unknown, lowerMessage: string) {
  const providerFromObject =
    input && typeof input === "object"
      ? (input as { provider?: unknown }).provider
      : null;

  if (providerFromObject === "openai") {
    return "OpenAI";
  }
  if (providerFromObject === "deepgram") {
    return "Deepgram";
  }
  if (providerFromObject === "anthropic") {
    return "Anthropic";
  }

  if (lowerMessage.includes("deepgram")) {
    return "Deepgram";
  }
  if (lowerMessage.includes("openai")) {
    return "OpenAI";
  }
  if (lowerMessage.includes("anthropic")) {
    return "Anthropic";
  }
  return "Provider";
}
