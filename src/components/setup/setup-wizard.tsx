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
  | "api_key"
  | "saving";

type SetupAnswers = {
  username: string;
  languageId: string;
  proficiency: ProficiencyLevel;
  defaultModel: AIProvider | null;
  apiKey: string | null;
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
  const [language, setLanguage] = useState<
    (typeof languages)[number] | null
  >(null);
  const [proficiency, setProficiency] = useState<ProficiencyLevel | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [providerApiKeyInput, setProviderApiKeyInput] = useState("");
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
      case "api_key":
      case "saving":
        return 5;
      default:
        return 1;
    }
  }, [step]);

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
    setStep("api_key");
  }

  async function handleProviderApiKeySubmit(value: string) {
    setIsSaving(true);
    setStep("saving");
    if (!language || !proficiency || !selectedProvider) {
      setIsSaving(false);
      return;
    }
    await onSubmit({
      username: username.trim(),
      languageId: language.id,
      proficiency,
      defaultModel: selectedProvider,
      apiKey: value.trim() ? value.trim() : null,
    });
    setIsSaving(false);
  }

  return (
    <AppFrame
      title="First-time setup"
      subtitle={`required before "${commandName}"`}
    >
      <StatusBadge tone="info" label={`Step ${activeStepIndex}/5`} />
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
            What is your current proficiency in this language?
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
            What is your current proficiency in this language?{" "}
          </Text>
          <Text color={theme.accent}>{proficiency}</Text>
        </Box>
      )}

      {step === "username" || step === "language" || step === "proficiency" ? null : step === "provider" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Which AI provider should Speekr use (grammar check, vocabulary, language learning)?
          </Text>
          <Box marginTop={1}>
            <SelectInput
              items={[
                { label: "OpenAI", value: "openai" as const },
                { label: "Anthropic", value: "anthropic" as const },
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
            Which AI provider should Speekr use (grammar check, vocabulary, language learning)?{" "}
          </Text>
          <Text color={theme.accent}>
            {selectedProvider === "anthropic" ? "Anthropic" : "OpenAI"}
          </Text>
        </Box>
      )}

      {step === "api_key" ? (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={theme.brand}>
            Enter your {selectedProvider === "anthropic" ? "Anthropic" : "OpenAI"} API key
          </Text>
          <Text color={theme.muted}>
            This input is masked to prevent key leaks in recordings.
          </Text>
          <Box>
            <TextInput
              value={providerApiKeyInput}
              mask="*"
              onChange={setProviderApiKeyInput}
              onSubmit={handleProviderApiKeySubmit}
            />
          </Box>
        </Box>
      ) : step === "saving" ? (
        <Box marginBottom={1}>
          <Text color={theme.brand}>
            {selectedProvider === "anthropic" ? "Anthropic" : "OpenAI"} API key{" "}
          </Text>
          <Text color={theme.accent}>{obfuscateApiKey(providerApiKeyInput)}</Text>
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
