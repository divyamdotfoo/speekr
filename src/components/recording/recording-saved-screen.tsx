import { Box, Text, render } from "ink";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";

export function renderRecordingSavedScreen(input: {
  outputPath: string;
  statusLabel: string;
  qualitySummary: string;
}) {
  render(
    <AppFrame title="Recording saved" subtitle="record">
      <Box marginBottom={1}>
        <Text color={theme.success}>●</Text>
        <Text color={theme.muted}>  </Text>
        <Text color={theme.text}>{input.statusLabel}</Text>
      </Box>

      <Text color={theme.muted}>Saved to</Text>
      <Text color={theme.text}>{input.outputPath}</Text>

      <Box marginTop={1}>
        <Text color={theme.muted}>{input.qualitySummary}</Text>
      </Box>
    </AppFrame>,
  );
}
