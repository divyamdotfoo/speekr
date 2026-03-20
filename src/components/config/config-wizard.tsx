import { Box, Text, useInput } from "ink";
import { render } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { useMemo, useState } from "react";
import {
  getConfiguration,
  getPrimaryUser,
  getPrimaryUserTrack,
  listSupportedLanguages,
  runInitialSetup,
} from "../../db/queries.ts";
import type {
  AIProvider,
  ProficiencyLevel,
  SupportedLanguage,
  TranscriptionChoice,
} from "../../types/index.ts";
import { StatusBadge } from "../feedback/status-badge.tsx";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";

type ConfigStep =
  | "username"
  | "language"
  | "proficiency"
  | "provider"
  | "transcription_choice"
  | "api_key"
  | "saving";

type ConfigAnswers = {
  username: string;
  languageId: string;
  proficiency: ProficiencyLevel;
  defaultModel: AIProvider;
  transcriptionChoice: Exclude<TranscriptionChoice, null>;
  apiKey: string | null;
};

type ConfigDefaults = {
  username: string;
  languageCode: string | null;
  proficiency: ProficiencyLevel;
  provider: AIProvider;
  transcriptionChoice: Exclude<TranscriptionChoice, null>;
  apiKeyByProvider: Record<AIProvider, string | null>;
};

export async function runConfigFlow(): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  const languages = listSupportedLanguages();
  const defaults = readConfigDefaults();

  return await new Promise<boolean>((resolve) => {
    const instance = render(
      <ConfigWizard
        languages={languages}
        defaults={defaults}
        onCancel={() => {
          instance.unmount();
          resolve(false);
        }}
        onSubmit={(answers) => {
          runInitialSetup(answers);
        }}
        onComplete={() => {
          instance.unmount();
          resolve(true);
        }}
      />
    );
  });
}

function ConfigWizard(input: {
  languages: SupportedLanguage[];
  defaults: ConfigDefaults;
  onSubmit: (answers: ConfigAnswers) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<ConfigStep>("username");
  const [usernameInput, setUsernameInput] = useState("");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const [selectedProficiency, setSelectedProficiency] =
    useState<ProficiencyLevel | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [selectedTranscriptionChoice, setSelectedTranscriptionChoice] = useState<
    Exclude<TranscriptionChoice, null> | null
  >(null);
  const [providerApiKeyInput, setProviderApiKeyInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  const activeStepIndex = useMemo(() => {
    switch (step) {
      case "username":
        return 1;
      case "language":
        return 2;
      case "proficiency":
        return 3;
      case "provider":
        return 4;
      case "transcription_choice":
        return 5;
      case "api_key":
      case "saving":
        return 6;
      default:
        return 1;
    }
  }, [step]);

  const selectedLanguageLabel =
    input.languages.find((language) => language.id === selectedLanguageId)?.label ??
    getCurrentLanguageLabel(input.languages, input.defaults.languageCode);
  const resolvedProvider = selectedProvider ?? input.defaults.provider;
  const resolvedTranscriptionChoice =
    selectedTranscriptionChoice ?? input.defaults.transcriptionChoice;

  useInput((value, key) => {
    if (key.escape || (key.ctrl && value === "c")) {
      input.onCancel();
    }
  });

  async function submitConfig(value: string) {
    setSaveStatus("saving");
    setStep("saving");

    const nextUsername = value.trim() || input.defaults.username;
    const fallbackLanguageId =
      resolveLanguageIdByCode(input.languages, input.defaults.languageCode) ??
      input.languages[0]?.id ??
      null;
    const nextLanguageId = selectedLanguageId ?? fallbackLanguageId;
    const nextProficiency = selectedProficiency ?? input.defaults.proficiency;
    const nextProvider = resolvedProvider;
    const existingProviderKey = input.defaults.apiKeyByProvider[nextProvider];
    const trimmedValue = value.trim();
    const nextApiKey =
      trimmedValue.toLowerCase() === "clear"
        ? null
        : trimmedValue
          ? trimmedValue
          : existingProviderKey;

    if (!nextLanguageId) {
      setSaveStatus("idle");
      input.onCancel();
      return;
    }

    input.onSubmit({
      username: nextUsername,
      languageId: nextLanguageId,
      proficiency: nextProficiency,
      defaultModel: nextProvider,
      transcriptionChoice: resolvedTranscriptionChoice,
      apiKey: nextApiKey,
    });
    setSaveStatus("saved");
    setTimeout(() => {
      input.onComplete();
    }, 700);
  }

  return (
    <AppFrame title="Update configuration" subtitle="config">
      <StatusBadge tone="info" label={`Step ${activeStepIndex}/6`} />
      <Box marginBottom={1}>
        <Text color={theme.muted}>
          Press Enter to keep current value. Press Esc or Ctrl+C to cancel.
        </Text>
      </Box>

      {step === "username" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>What should we call you?</Text>
          <Text color={theme.muted}>Current: {input.defaults.username || "Not set"}</Text>
          <Box>
            <Text color={theme.accent}>@ </Text>
            <TextInput
              value={usernameInput}
              onChange={setUsernameInput}
              onSubmit={() => {
                setStep("language");
              }}
            />
          </Box>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color={theme.brand}>What should we call you? </Text>
          <Text color={theme.accent}>
            {usernameInput.trim() || input.defaults.username || "Not set"}
          </Text>
        </Box>
      )}

      {step === "username" ? null : step === "language" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            What is the primary language you want to practice?
          </Text>
          <Text color={theme.muted}>
            Current: {getCurrentLanguageLabel(input.languages, input.defaults.languageCode)}
          </Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                {
                  label: `Keep current (${getCurrentLanguageLabel(
                    input.languages,
                    input.defaults.languageCode
                  )})`,
                  value: null as string | null,
                },
                ...input.languages.map((language) => ({
                  label: language.label,
                  value: language.id,
                })),
              ]}
              onSelect={(item) => {
                setSelectedLanguageId(item.value);
                setStep("proficiency");
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
            What is the primary language you want to practice?{" "}
          </Text>
          <Text color={theme.accent}>{selectedLanguageLabel}</Text>
        </Box>
      )}

      {step === "username" || step === "language" ? null : step ===
        "proficiency" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            What is your current proficiency in this language?
          </Text>
          <Text color={theme.muted}>Current: {input.defaults.proficiency}</Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                {
                  label: `Keep current (${input.defaults.proficiency})`,
                  value: null as ProficiencyLevel | null,
                },
                { label: "beginner", value: "beginner" as const },
                { label: "intermediate", value: "intermediate" as const },
                { label: "advanced", value: "advanced" as const },
              ]}
              onSelect={(item) => {
                setSelectedProficiency(item.value);
                setStep("provider");
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
            What is your current proficiency in this language?{" "}
          </Text>
          <Text color={theme.accent}>
            {selectedProficiency ?? input.defaults.proficiency}
          </Text>
        </Box>
      )}

      {step === "username" || step === "language" || step === "proficiency" ? null : step === "provider" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Which AI provider should Speekr use (grammar check, vocabulary, language learning)?
          </Text>
          <Text color={theme.muted}>
            Current: {input.defaults.provider === "anthropic" ? "Anthropic" : "OpenAI"}
          </Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                {
                  label: `Keep current (${input.defaults.provider === "anthropic" ? "Anthropic" : "OpenAI"})`,
                  value: null as AIProvider | null,
                },
                { label: "OpenAI", value: "openai" as const },
                { label: "Anthropic", value: "anthropic" as const },
              ]}
              onSelect={(item) => {
                setSelectedProvider(item.value);
                setStep("transcription_choice");
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
            Which AI provider should Speekr use (grammar check, vocabulary, language learning)?{" "}
          </Text>
          <Text color={theme.accent}>
            {resolvedProvider === "anthropic" ? "Anthropic" : "OpenAI"}
          </Text>
        </Box>
      )}

      {step === "username" ||
      step === "language" ||
      step === "proficiency" ||
      step === "provider" ? null : step === "transcription_choice" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Which transcription mode should Speekr use by default for recordings?
          </Text>
          <Text color={theme.muted}>
            Current:{" "}
            {input.defaults.transcriptionChoice === "https" ? "HTTPS" : "Local"}
          </Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                {
                  label: `Keep current (${input.defaults.transcriptionChoice === "https" ? "HTTPS" : "Local"})`,
                  value: null as Exclude<TranscriptionChoice, null> | null,
                },
                { label: "Local", value: "local" as const },
                { label: "HTTPS", value: "https" as const },
              ]}
              onSelect={(item) => {
                setSelectedTranscriptionChoice(item.value);
                setStep("api_key");
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
            Which transcription mode should Speekr use by default for recordings?{" "}
          </Text>
          <Text color={theme.accent}>
            {resolvedTranscriptionChoice === "https" ? "HTTPS" : "Local"}
          </Text>
        </Box>
      )}

      {step === "api_key" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Enter your {resolvedProvider === "anthropic" ? "Anthropic" : "OpenAI"} API key
          </Text>
          <Text color={theme.muted}>
            Current: {obfuscateApiKey(input.defaults.apiKeyByProvider[resolvedProvider])}
          </Text>
          <Text color={theme.muted}>
            Press Enter on empty input to keep current key. Type "clear" to remove it.
          </Text>
          <Box>
            <TextInput
              value={providerApiKeyInput}
              mask="*"
              onChange={setProviderApiKeyInput}
              onSubmit={submitConfig}
            />
          </Box>
        </Box>
      ) : step === "saving" ? (
        <Box marginBottom={1}>
          <Text color={theme.brand}>
            {resolvedProvider === "anthropic" ? "Anthropic" : "OpenAI"} API key{" "}
          </Text>
          <Text color={theme.accent}>
            {providerApiKeyInput.trim().toLowerCase() === "clear"
              ? "Cleared"
              : providerApiKeyInput.trim()
              ? obfuscateApiKey(providerApiKeyInput)
              : `${obfuscateApiKey(input.defaults.apiKeyByProvider[resolvedProvider])} (kept)`}
          </Text>
        </Box>
      ) : null}

      {step === "saving" ? (
        <Box>
          <Text color={theme.success}>
            {saveStatus === "saved" ? "Config updated." : "Applying config..."}
          </Text>
        </Box>
      ) : null}
    </AppFrame>
  );
}

function readConfigDefaults(): ConfigDefaults {
  const configuration = getConfiguration();
  const primaryUser = getPrimaryUser();
  const primaryTrack = primaryUser ? getPrimaryUserTrack(primaryUser.id) : null;

  return {
    username: primaryUser?.name ?? "",
    languageCode: primaryTrack?.language ?? null,
    proficiency: primaryTrack?.proficiency ?? "beginner",
    provider: configuration.defaultModel ?? "openai",
    transcriptionChoice: configuration.transcriptionChoice ?? "local",
    apiKeyByProvider: {
      openai: configuration.openAIKey ?? null,
      anthropic: configuration.anthropicKey ?? null,
    },
  };
}

function getCurrentLanguageLabel(
  languages: SupportedLanguage[],
  code: string | null
) {
  if (!code) {
    return "Not set";
  }
  const matched = languages.find((language) => language.code === code);
  return matched?.label ?? code;
}

function resolveLanguageIdByCode(
  languages: SupportedLanguage[],
  code: string | null
) {
  if (!code) {
    return null;
  }
  return languages.find((language) => language.code === code)?.id ?? null;
}

function obfuscateApiKey(key: string | null) {
  const trimmed = key?.trim() ?? "";
  if (!trimmed) {
    return "Not set";
  }
  if (trimmed.length <= 4) {
    return "*".repeat(trimmed.length);
  }
  return `${"*".repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}
