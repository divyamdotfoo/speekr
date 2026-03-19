import { Box, Text, render } from "ink";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";

export function renderRecordingSavedScreen(input: {
  outputPath: string;
  statusLabel: string;
  qualitySummary: string;
  transcriptPath?: string;
  transcriptionStatus?: string;
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

      {input.transcriptionStatus ? (
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.muted}>Transcription</Text>
          <Text color={theme.text}>{input.transcriptionStatus}</Text>
          {input.transcriptPath ? (
            <>
              <Text color={theme.muted}>Transcript file</Text>
              <Text color={theme.text}>{input.transcriptPath}</Text>
            </>
          ) : null}
        </Box>
      ) : null}

      <Box marginTop={1}>
        <Text color={theme.muted}>{input.qualitySummary}</Text>
      </Box>
    </AppFrame>,
  );
}
