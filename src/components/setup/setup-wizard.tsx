import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useMemo, useState } from "react";
import type { ProficiencyLevel } from "../../types/index.ts";
import { MessagePanel } from "../feedback/message-panel.tsx";
import { StatusBadge } from "../feedback/status-badge.tsx";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";
import { ProficiencySelect } from "./proficiency-select.tsx";

type SetupStep = "username" | "language" | "proficiency" | "saving";

export type SetupAnswers = {
  username: string;
  language: string;
  proficiency: ProficiencyLevel;
};

export function SetupWizard({
  commandName,
  onSubmit,
  onCancel,
}: {
  commandName: string;
  onSubmit: (answers: SetupAnswers) => Promise<void>;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<SetupStep>("username");
  const [username, setUsername] = useState("");
  const [language, setLanguage] = useState("");
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

  async function handleProficiencySelect(proficiency: ProficiencyLevel) {
    setIsSaving(true);
    setStep("saving");
    await onSubmit({
      username: username.trim(),
      language: language.trim(),
      proficiency,
    });
    setIsSaving(false);
  }

  return (
    <AppFrame title="First-time setup" subtitle={`required before "${commandName}"`}>
      <StatusBadge tone="info" label={`Step ${activeStepIndex}/3`} />
      <Box marginBottom={1}>
        <Text color={theme.muted}>
          Press Esc or Ctrl+C to cancel setup at any time.
        </Text>
      </Box>

      {step === "username" ? (
        <MessagePanel tone="info" title="Profile">
          <Box flexDirection="column">
            <Text color={theme.text}>What should we call you?</Text>
            <Text color={theme.accent}>@</Text>
            <TextInput
              value={username}
              onChange={setUsername}
              onSubmit={(value) => {
                if (!value.trim()) {
                  return;
                }
                setStep("language");
              }}
            />
          </Box>
        </MessagePanel>
      ) : null}

      {step === "language" ? (
        <MessagePanel tone="info" title="Learning track">
          <Box flexDirection="column">
            <Text color={theme.text}>Which language do you want to practice?</Text>
            <Text color={theme.accent}>{">"}</Text>
            <TextInput
              value={language}
              onChange={setLanguage}
              onSubmit={(value) => {
                if (!value.trim()) {
                  return;
                }
                setStep("proficiency");
              }}
            />
          </Box>
        </MessagePanel>
      ) : null}

      {step === "proficiency" ? (
        <MessagePanel tone="info" title="Current proficiency">
          <ProficiencySelect onSelect={handleProficiencySelect} />
        </MessagePanel>
      ) : null}

      {step === "saving" && isSaving ? (
        <MessagePanel tone="success" title="Applying setup">
          <Box>
            <Text color={theme.success}>Saving your profile and preparing commands...</Text>
          </Box>
        </MessagePanel>
      ) : null}
    </AppFrame>
  );
}
