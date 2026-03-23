import { Box, Text, useInput } from "ink";
import { render } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { useMemo, useState } from "react";
import { listSupportedLanguages, runInitialSetup } from "../../db/queries.ts";
import type {
  AIProvider,
  ProficiencyLevel,
  SupportedLanguage,
  TranscriptionChoice,
} from "../../types/index.ts";
import { StatusBadge } from "../feedback/status-badge.tsx";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import { LanguageSelect } from "./language-select.tsx";
import { ProficiencySelect } from "./proficiency-select.tsx";

type SetupStep =
  | "username"
  | "language"
  | "proficiency"
  | "provider"
  | "transcription_choice"
  | "api_key"
  | "saving";

type SetupAnswers = {
  username: string;
  languageId: string;
  proficiency: ProficiencyLevel;
  defaultModel: AIProvider | null;
  transcriptionChoice: Exclude<TranscriptionChoice, null>;
  openAIKey?: string | null;
  anthropicKey?: string | null;
  deepgramKey?: string | null;
};

export async function runSetupFlow(commandName: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  const languages = listSupportedLanguages();

  return await new Promise<boolean>((resolve) => {
    const instance = render(
      <SetupWizard
        commandName={commandName}
        languages={languages}
        onCancel={() => {
          instance.unmount();
          resolve(false);
        }}
        onSubmit={async (answers: SetupAnswers) => {
          runInitialSetup(answers);
          instance.unmount();
          resolve(true);
        }}
      />
    );
  });
}

function SetupWizard({
  commandName,
  languages,
  onSubmit,
  onCancel,
}: {
  commandName: string;
  languages: SupportedLanguage[];
  onSubmit: (answers: SetupAnswers) => Promise<void>;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<SetupStep>("username");
  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState<(typeof languages)[number] | null>(
    null
  );
  const [proficiency, setProficiency] = useState<ProficiencyLevel | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    null
  );
  const [selectedTranscriptionChoice, setSelectedTranscriptionChoice] =
    useState<Exclude<TranscriptionChoice, null> | null>(null);

  type KeyKind = "openai" | "anthropic" | "deepgram";
  const [keyKindsToCollect, setKeyKindsToCollect] = useState<KeyKind[]>([]);
  const [keyKindsIndex, setKeyKindsIndex] = useState(0);
  const [collectedApiKeysByKind, setCollectedApiKeysByKind] = useState<
    Partial<Record<KeyKind, string>>
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

  const activeKeyKind = keyKindsToCollect[keyKindsIndex];
  const activeKeyKindLabel =
    activeKeyKind === "anthropic"
      ? "Anthropic"
      : activeKeyKind === "deepgram"
      ? "Deepgram"
      : "OpenAI";

  const currentStepNumber =
    step === "api_key"
      ? 6 + keyKindsIndex
      : step === "saving"
        ? 6 + keyKindsToCollect.length
        : activeStepIndex;

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      onCancel();
    }
  });

  function handleProficiencySelect(value: ProficiencyLevel) {
    setProficiency(value);
    setStep("provider");
  }

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
    setStep("api_key");
  }

  async function handleProviderApiKeySubmit() {
    const trimmedValue = providerApiKeyInput.trim();
    if (trimmedValue.length < 10) {
      setProviderApiKeyError("Please enter a valid API key.");
      return;
    }

    const activeKind = keyKindsToCollect[keyKindsIndex];
    if (!activeKind) {
      setProviderApiKeyError("Internal error: no API key requested.");
      return;
    }

    setProviderApiKeyError(null);

    const nextCollected = {
      ...collectedApiKeysByKind,
      [activeKind]: trimmedValue,
    } satisfies Partial<Record<KeyKind, string>>;

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

    if (
      !language ||
      !proficiency ||
      !selectedProvider ||
      !selectedTranscriptionChoice
    ) {
      setIsSaving(false);
      return;
    }

    await onSubmit({
      username: username.trim(),
      languageId: language.id,
      proficiency,
      defaultModel: selectedProvider,
      transcriptionChoice: selectedTranscriptionChoice,
      openAIKey: nextCollected.openai,
      anthropicKey: nextCollected.anthropic,
      deepgramKey: nextCollected.deepgram,
    });

    setIsSaving(false);
  }

  return (
    <AppFrame
      title="First-time setup"
      subtitle={`required before "${commandName}"`}
    >
      <StatusBadge tone="info" label={`Step ${currentStepNumber}`} />
      <Box marginBottom={1}>
        <Text color={theme.muted}>Press Esc or Ctrl+C to cancel setup.</Text>
      </Box>

      {step === "username" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>What should we call you?</Text>
          <Box>
            <Text color={theme.accent}>@ </Text>
            <TextInput
              value={username}
              onChange={setUsername}
              onSubmit={(value) => {
                if (!value.trim()) {
                  return;
                }
                setUsername(value.trim());
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
            What is the first language you want to practice?
          </Text>
          <Box marginTop={1}>
            <LanguageSelect
              languages={languages}
              onSelect={(value) => {
                setLanguage(value);
                setStep("proficiency");
              }}
            />
          </Box>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color={theme.brand}>
            What is the first language you want to practice?{" "}
          </Text>
          <Text color={theme.accent}>{language?.label}</Text>
        </Box>
      )}

      {step === "username" || step === "language" ? null : step ===
        "proficiency" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            What is your current proficiency in this language? Rate from 1 to
            10.
          </Text>
          <Text color={theme.muted}>
            Selected language: {language?.label} ({language?.code})
          </Text>
          <Box marginTop={1}>
            <ProficiencySelect onSelect={handleProficiencySelect} />
          </Box>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text color={theme.brand}>
            What is your current proficiency in this language? Rate from 1 to
            10.{" "}
          </Text>
          <Text color={theme.accent}>{proficiency}</Text>
        </Box>
      )}

      {step === "username" ||
      step === "language" ||
      step === "proficiency" ? null : step === "provider" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Which AI provider should Speekr use (grammar check, vocabulary,
            language learning)?
          </Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
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
                handleProviderSelect(item.value);
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
      step === "proficiency" ||
      step === "provider" ? null : step === "transcription_choice" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Which transcription mode should Speekr use by default for
            recordings?
          </Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
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
                handleTranscriptionChoiceSelect(item.value);
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
            This input is masked to prevent key leaks in recordings.
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

function obfuscateApiKey(key: string) {
  const trimmed = key.trim();
  if (!trimmed) {
    return "Not provided";
  }
  if (trimmed.length <= 4) {
    return "*".repeat(trimmed.length);
  }
  return `${"*".repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}
