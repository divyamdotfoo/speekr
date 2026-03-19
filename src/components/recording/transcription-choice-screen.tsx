import { Box, Text, render, useInput } from "ink";
import SelectInput from "ink-select-input";
import { TRANSCRIPTION_CHOICES, TRANSCRIPTION_CONFIG } from "../../constants/config.ts";
import type { TranscriptionChoice } from "../../types/index.ts";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";

export async function runTranscriptionChoiceScreen() {
  return await new Promise<Exclude<TranscriptionChoice, null> | null>((resolve) => {
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
      />,
    );
  });
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
          Choose how Speekr should transcribe your recordings before we start capture.
        </Text>
      </Box>
      <Box marginBottom={1} flexDirection="column">
        <Text color={theme.warning}>
          Local mode downloads the {TRANSCRIPTION_CONFIG.localModelName} model ({TRANSCRIPTION_CONFIG.localModelDownloadSizeLabel})
          and first setup can take {TRANSCRIPTION_CONFIG.firstRunDurationLabel}.
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
          <Text color={isSelected ? theme.accent : theme.muted}>{isSelected ? "● " : "○ "}</Text>
        )}
      />

      <Box marginTop={1}>
        <Text color={theme.muted}>{TRANSCRIPTION_CHOICES[0]?.description}</Text>
        <Text color={theme.muted}>{TRANSCRIPTION_CHOICES[1]?.description}</Text>
        <Text color={theme.muted}>Press Ctrl+C to cancel.</Text>
      </Box>
    </AppFrame>
  );
}
