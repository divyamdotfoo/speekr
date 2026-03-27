import { Box, Text, render, useInput } from "ink";
import SelectInput from "ink-select-input";
import type { TranscriptionChoice } from "../../types/index.ts";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";

export async function runTranscriptionChoiceScreen() {
  return await new Promise<Exclude<TranscriptionChoice, null> | null>(
    (resolve) => {
      const instance = render(
        <TranscriptionChoiceScreen
          onSelect={(choice) => {
            instance.unmount();
            resolve(choice);
          }}
          onCancel={() => {
            instance.unmount();
            resolve(null);
          }}
        />
      );
    }
  );
}

function TranscriptionChoiceScreen(input: {
  onSelect: (choice: Exclude<TranscriptionChoice, null>) => void;
  onCancel: () => void;
}) {
  useInput((value, key) => {
    if (key.escape || (key.ctrl && value === "c")) {
      input.onCancel();
    }
  });

  return (
    <AppFrame title="Choose transcription mode" subtitle="record">
      <Box marginBottom={1} flexDirection="column">
        <Text color={theme.muted}>
          Choose how Speekr should transcribe this recording for grammar checks,
          vocabulary suggestions, and language-learning feedback.
        </Text>
      </Box>
      <Box marginBottom={1} flexDirection="column">
        <Text color={theme.warning}>
          Recommended: Local mode is free, private, and works offline.
        </Text>
      </Box>

      <SelectInput
        items={TRANSCRIPTION_CHOICES.map((choice) => ({
          label: choice.label,
          value: choice.value,
        }))}
        onSelect={(item) => {
          input.onSelect(item.value);
        }}
        indicatorComponent={({ isSelected }) => (
          <Text color={isSelected ? theme.accent : theme.muted}>
            {isSelected ? "● " : "○ "}
          </Text>
        )}
      />
    </AppFrame>
  );
}

const TRANSCRIPTION_CHOICES: Array<{
  value: Exclude<TranscriptionChoice, null>;
  label: string;
}> = [
  {
    value: "local",
    label:
      "Local (recommended, free, private, takes 2-3 minutes to setup, uses faster-whisper)",
  },
  {
    value: "openai",
    label:
      "OpenAI (usage-based cost, works without setup, uses OpenAI Whisper)",
  },
  {
    value: "deepgram",
    label: "Deepgram (usage-based cost, works without setup, uses Deepgram)",
  },
];
