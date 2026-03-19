import { Box, Text, useInput } from "ink";
import { render } from "ink";
import TextInput from "ink-text-input";
import { useMemo, useState } from "react";
import { listSupportedLanguages, runInitialSetup } from "../../db/queries.ts";
import type { ProficiencyLevel, SupportedLanguage } from "../../types/index.ts";
import { StatusBadge } from "../feedback/status-badge.tsx";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import { LanguageSelect } from "./language-select.tsx";
import { ProficiencySelect } from "./proficiency-select.tsx";

type SetupStep = "username" | "language" | "proficiency" | "saving";

export type SetupAnswers = {
  username: string;
  languageId: string;
  proficiency: ProficiencyLevel;
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

export function SetupWizard({
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
  const [isSaving, setIsSaving] = useState(false);

  const activeStepIndex = useMemo(() => {
    switch (step) {
      case "username":
        return 1;
      case "language":
        return 2;
      case "proficiency":
      case "saving":
        return 3;
      default:
        return 1;
    }
  }, [step]);

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === "c")) {
      onCancel();
    }
  });

  async function handleProficiencySelect(value: ProficiencyLevel) {
    setProficiency(value);
    setIsSaving(true);
    setStep("saving");
    if (!language) {
      return;
    }
    await onSubmit({
      username: username.trim(),
      languageId: language.id,
      proficiency: value,
    });
    setIsSaving(false);
  }

  return (
    <AppFrame
      title="First-time setup"
      subtitle={`required before "${commandName}"`}
    >
      <StatusBadge tone="info" label={`Step ${activeStepIndex}/3`} />
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
