import { Box, Text, useInput } from "ink";
import { render } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { useMemo, useState } from "react";
import {
  config,
  learning,
  setup,
  user,
} from "../../db/queries/index.ts";
import type {
  AIProvider,
  Configuration,
  SupportedLanguage,
  TranscriptionChoice,
} from "../../types/index.ts";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import { LanguageMultiSelect } from "./language-multi-select.tsx";

type SetupStep =
  | "username"
  | "language"
  | "provider"
  | "transcription_choice"
  | "api_key"
  | "saving";

type SetupAnswers = {
  username: string;
  languageIds: string[];
  defaultModel: AIProvider | null;
  transcriptionChoice: Exclude<TranscriptionChoice, null>;
  openAIKey?: string | null;
  anthropicKey?: string | null;
  deepgramKey?: string | null;
};

type SetupDefaults = {
  username: string;
  languageIds: string[];
  defaultModel: AIProvider | null;
  transcriptionChoice: Exclude<TranscriptionChoice, null>;
  apiKeys: {
    openai: string | null;
    anthropic: string | null;
    deepgram: string | null;
  };
};

export async function runSetupFlow(commandName: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  const languages = learning.listSupportedLanguages();
  const defaults = readSetupDefaults(languages);
  void commandName;

  return await new Promise<boolean>((resolve) => {
    const instance = render(
      <SetupWizard
        languages={languages}
        defaults={defaults}
        onCancel={() => {
          instance.unmount();
          resolve(false);
        }}
        onSubmit={async (answers: SetupAnswers) => {
          setup.runInitialSetup(answers);
          instance.unmount();
          resolve(true);
        }}
      />
    );
  });
}

function SetupWizard({
  languages,
  defaults,
  onSubmit,
  onCancel,
}: {
  languages: SupportedLanguage[];
  defaults: SetupDefaults;
  onSubmit: (answers: SetupAnswers) => Promise<void>;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<SetupStep>("username");
  const [username, setUsername] = useState(defaults.username);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>(
    defaults.languageIds
  );
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    defaults.defaultModel
  );
  const [selectedTranscriptionChoice, setSelectedTranscriptionChoice] =
    useState<Exclude<TranscriptionChoice, null> | null>(
      defaults.transcriptionChoice
    );

  type KeyKind = "openai" | "anthropic" | "deepgram";
  const [keyKindsToCollect, setKeyKindsToCollect] = useState<KeyKind[]>([]);
  const [keyKindsIndex, setKeyKindsIndex] = useState(0);
  const [collectedApiKeysByKind, setCollectedApiKeysByKind] = useState<
    Partial<Record<KeyKind, string | null>>
  >({});

  const [providerApiKeyInput, setProviderApiKeyInput] = useState("");
  const [providerApiKeyError, setProviderApiKeyError] = useState<string | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const activeStepIndex = useMemo(() => {
    switch (step) {
      case "username":
        return 1;
      case "language":
        return 2;
      case "provider":
        return 3;
      case "transcription_choice":
        return 4;
      case "api_key":
      case "saving":
        return 5;
      default:
        return 1;
    }
  }, [step]);

  const activeKeyKind = keyKindsToCollect[keyKindsIndex];
  const activeKeyKindLabel =
    activeKeyKind === "anthropic"
      ? "Anthropic"
      : activeKeyKind === "deepgram"
      ? "Deepgram"
      : "OpenAI";

  const currentStepNumber =
    step === "api_key" ? 5 + keyKindsIndex : activeStepIndex;

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      onCancel();
    }
  });

  function handleProviderSelect(value: AIProvider) {
    setSelectedProvider(value);
    setProviderApiKeyError(null);
    setStep("transcription_choice");
  }

  function handleTranscriptionChoiceSelect(
    value: Exclude<TranscriptionChoice, null>
  ) {
    setSelectedTranscriptionChoice(value);
    const kinds: KeyKind[] = [];
    if (selectedProvider === "openai") {
      kinds.push("openai");
    } else if (selectedProvider === "anthropic") {
      kinds.push("anthropic");
    }

    if (value === "openai" && !kinds.includes("openai")) {
      kinds.push("openai");
    }
    if (value === "deepgram" && !kinds.includes("deepgram")) {
      kinds.push("deepgram");
    }

    setKeyKindsToCollect(kinds);
    setKeyKindsIndex(0);
    setCollectedApiKeysByKind({});
    setProviderApiKeyInput("");
    setProviderApiKeyError(null);
    if (kinds.length === 0) {
      void submitSetup({});
      return;
    }
    setStep("api_key");
  }

  async function submitSetup(
    overrides: Partial<Record<KeyKind, string | null | undefined>>
  ) {
    const mergedApiKeys = {
      ...collectedApiKeysByKind,
      ...overrides,
    };
    const resolvedUsername = username.trim() || defaults.username;

    if (
      selectedLanguageIds.length === 0 ||
      !selectedProvider ||
      !selectedTranscriptionChoice ||
      !resolvedUsername
    ) {
      setIsSaving(false);
      return;
    }

    await onSubmit({
      username: resolvedUsername,
      languageIds: selectedLanguageIds,
      defaultModel: selectedProvider,
      transcriptionChoice: selectedTranscriptionChoice,
      openAIKey: mergedApiKeys.openai,
      anthropicKey: mergedApiKeys.anthropic,
      deepgramKey: mergedApiKeys.deepgram,
    });
    setIsSaving(false);
  }

  async function handleProviderApiKeySubmit() {
    const activeKind = keyKindsToCollect[keyKindsIndex];
    if (!activeKind) {
      setProviderApiKeyError("Internal error: no API key requested.");
      return;
    }

    const trimmedValue = providerApiKeyInput.trim();
    if (trimmedValue.length > 0 && trimmedValue.length < 10) {
      setProviderApiKeyError("Please enter a valid API key.");
      return;
    }

    setProviderApiKeyError(null);

    const nextValue =
      trimmedValue.length === 0
        ? undefined
        : trimmedValue.toLowerCase() === "clear"
        ? null
        : trimmedValue;
    const nextCollected = {
      ...collectedApiKeysByKind,
      ...(nextValue !== undefined ? { [activeKind]: nextValue } : {}),
    } satisfies Partial<Record<KeyKind, string | null>>;

    // More than one key might be required (e.g. OpenAI for language learning + Deepgram for transcription).
    if (keyKindsIndex < keyKindsToCollect.length - 1) {
      setCollectedApiKeysByKind(nextCollected);
      setKeyKindsIndex(keyKindsIndex + 1);
      setProviderApiKeyInput("");
      return;
    }

    setCollectedApiKeysByKind(nextCollected);
    setIsSaving(true);
    setStep("saving");
    await submitSetup(nextCollected);
  }

  return (
    <AppFrame
      title={resolveSetupStepLabel(step)}
      subtitle={`Step ${currentStepNumber}`}
      meta="Esc/Ctrl+C to cancel setup"
    >
      {step === "username" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>What should we call you?</Text>
          {defaults.username ? (
            <Text color={theme.muted}>Current: {defaults.username}</Text>
          ) : null}
          <Box>
            <Text color={theme.accent}>@ </Text>
            <TextInput
              value={username}
              onChange={setUsername}
              onSubmit={(value) => {
                if (!value.trim() && !defaults.username) {
                  return;
                }
                if (value.trim()) {
                  setUsername(value.trim());
                }
                setStep("language");
              }}
            />
          </Box>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color={theme.brand}>What should we call you? </Text>
          <Text color={theme.accent}>{username.trim()}</Text>
        </Box>
      )}

      {step === "username" ? null : step === "language" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Which languages do you want to practice? (use y = select, n =
            unselect, Enter = continue)
          </Text>
          {defaults.languageIds.length > 0 ? (
            <Text color={theme.muted}>
              Current:{" "}
              {languages
                .filter((language) =>
                  defaults.languageIds.includes(language.id)
                )
                .map((language) => language.label)
                .join(", ")}
            </Text>
          ) : null}
          <Box marginTop={1}>
            <LanguageMultiSelect
              languages={languages}
              initialSelectedLanguageIds={selectedLanguageIds}
              onSubmit={(value) => {
                setSelectedLanguageIds(value);
                setStep("provider");
              }}
            />
          </Box>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color={theme.brand}>
            Which languages do you want to practice?{" "}
          </Text>
          <Text color={theme.accent}>
            {languages
              .filter((language) => selectedLanguageIds.includes(language.id))
              .map((language) => language.label)
              .join(", ")}
          </Text>
        </Box>
      )}

      {step === "username" || step === "language" ? null : step ===
        "provider" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Which AI provider should Speekr use (grammar check, vocabulary,
            language learning)?
          </Text>
          {defaults.defaultModel ? (
            <Text color={theme.muted}>
              Current:{" "}
              {defaults.defaultModel === "anthropic" ? "Anthropic" : "OpenAI"}
            </Text>
          ) : null}
          <Box marginTop={1}>
            <SelectInput
              items={[
                ...(defaults.defaultModel
                  ? [
                      {
                        label: `Keep current (${
                          defaults.defaultModel === "anthropic"
                            ? "Anthropic"
                            : "OpenAI"
                        })`,
                        value: `keep:${defaults.defaultModel}` as const,
                      },
                    ]
                  : []),
                {
                  label: "OpenAI (cheaper, requires API key)",
                  value: "openai" as const,
                },
                {
                  label: "Anthropic (expensive, requires API key)",
                  value: "anthropic" as const,
                },
              ]}
              onSelect={(item) => {
                handleProviderSelect(resolveProviderSelection(item.value));
              }}
              indicatorComponent={({ isSelected }) => (
                <Text color={isSelected ? theme.accent : theme.muted}>
                  {isSelected ? "● " : "○ "}
                </Text>
              )}
            />
          </Box>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color={theme.brand}>
            Which AI provider should Speekr use (grammar check, vocabulary,
            language learning)?{" "}
          </Text>
          <Text color={theme.accent}>
            {selectedProvider === "anthropic" ? "Anthropic" : "OpenAI"}
          </Text>
        </Box>
      )}

      {step === "username" ||
      step === "language" ||
      step === "provider" ? null : step === "transcription_choice" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Which transcription mode should Speekr use by default for
            recordings?
          </Text>
          <Text color={theme.muted}>
            Current:{" "}
            {defaults.transcriptionChoice === "local"
              ? "Local"
              : defaults.transcriptionChoice === "openai"
              ? "OpenAI"
              : "Deepgram"}
          </Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                {
                  label: `Keep current (${
                    defaults.transcriptionChoice === "local"
                      ? "Local"
                      : defaults.transcriptionChoice === "openai"
                      ? "OpenAI"
                      : "Deepgram"
                  })`,
                  value: `keep:${defaults.transcriptionChoice}` as const,
                },
                {
                  label:
                    "Local (free, takes 2-3 minutes to setup, uses faster-whisper)",
                  value: "local" as const,
                },
                {
                  label: "OpenAI (No free tier, usage-based, requires API key)",
                  value: "openai" as const,
                },
                {
                  label:
                    "Deepgram ($200 free credits, usage-based, requires API key)",
                  value: "deepgram" as const,
                },
              ]}
              onSelect={(item) => {
                handleTranscriptionChoiceSelect(
                  resolveTranscriptionSelection(item.value)
                );
              }}
              indicatorComponent={({ isSelected }) => (
                <Text color={isSelected ? theme.accent : theme.muted}>
                  {isSelected ? "● " : "○ "}
                </Text>
              )}
            />
          </Box>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color={theme.brand}>
            Which transcription mode should Speekr use by default for
            recordings?{" "}
          </Text>
          <Text color={theme.accent}>
            {selectedTranscriptionChoice === "local"
              ? "Local"
              : selectedTranscriptionChoice === "openai"
              ? "OpenAI"
              : "Deepgram"}
          </Text>
        </Box>
      )}

      {step === "api_key" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Enter your {activeKeyKindLabel} API key
          </Text>
          <Text color={theme.muted}>
            API key {keyKindsIndex + 1}/{keyKindsToCollect.length}
          </Text>
          <Text color={theme.muted}>
            Current:{" "}
            {obfuscateApiKey(defaults.apiKeys[activeKeyKind ?? "openai"])}
          </Text>
          <Text color={theme.muted}>
            Press Enter to keep current key, or type a new key.
          </Text>
          <Box>
            <TextInput
              value={providerApiKeyInput}
              mask="*"
              onChange={(value) => {
                setProviderApiKeyInput(value);
                if (providerApiKeyError) {
                  setProviderApiKeyError(null);
                }
              }}
              onSubmit={handleProviderApiKeySubmit}
            />
          </Box>
          {providerApiKeyError ? (
            <Text color={theme.danger}>{providerApiKeyError}</Text>
          ) : null}
        </Box>
      ) : step === "saving" ? (
        <Box marginBottom={1}>
          <Text color={theme.brand}>{activeKeyKindLabel} API key </Text>
          <Text color={theme.accent}>
            {obfuscateApiKey(providerApiKeyInput)}
          </Text>
        </Box>
      ) : null}

      {step === "saving" && isSaving ? (
        <Box>
          <Text color={theme.success}>Applying setup... </Text>
          <Text color={theme.muted}>
            saving profile and preparing commands.
          </Text>
        </Box>
      ) : null}
    </AppFrame>
  );
}

function obfuscateApiKey(key: string | null | undefined) {
  const trimmed = key?.trim() ?? "";
  if (!trimmed) {
    return "Not provided";
  }
  if (trimmed.length <= 4) {
    return "*".repeat(trimmed.length);
  }
  return `${"*".repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

function resolveSetupStepLabel(step: SetupStep) {
  switch (step) {
    case "username":
      return "Setup / Username";
    case "language":
      return "Setup / Languages";
    case "provider":
      return "Setup / AI provider";
    case "transcription_choice":
      return "Setup / Transcription";
    case "api_key":
      return "Setup / API key";
    case "saving":
      return "Setup / Saving";
    default:
      return "Setup";
  }
}

function readSetupDefaults(languages: SupportedLanguage[]): SetupDefaults {
  const primaryUser = user.getPrimaryUser();
  const configuration = config.getConfiguration();
  const tracks = primaryUser ? user.listUserTracksByUserId(primaryUser.id) : [];
  const languageByCode = new Map(
    languages.map((language) => [language.code, language.id])
  );

  return {
    username: primaryUser?.name ?? "",
    languageIds: tracks
      .map((track) => languageByCode.get(track.language))
      .filter((value): value is string => Boolean(value)),
    defaultModel: configuration.defaultModel,
    transcriptionChoice: resolveTranscriptionChoice(configuration),
    apiKeys: {
      openai: configuration.openAIKey,
      anthropic: configuration.anthropicKey,
      deepgram: configuration.deepgramKey,
    },
  };
}

function resolveTranscriptionChoice(configuration: Configuration) {
  return configuration.transcriptionChoice ?? "local";
}

function resolveProviderSelection(value: string): AIProvider {
  return value.startsWith("keep:")
    ? (value.slice(5) as AIProvider)
    : (value as AIProvider);
}

function resolveTranscriptionSelection(
  value: string
): Exclude<TranscriptionChoice, null> {
  return value.startsWith("keep:")
    ? (value.slice(5) as Exclude<TranscriptionChoice, null>)
    : (value as Exclude<TranscriptionChoice, null>);
}
