import { Box, Text, render } from "ink";
import { ErrorFrame } from "./error-frame.tsx";
import { theme } from "../theme/tokens.ts";

export function renderErrorScreen(input: {
  title: string;
  statusLabel: string;
  message: string;
  subtitle?: string;
}) {
  if (!process.stdin.isTTY) {
    console.error(`${input.title}: ${input.message}`);
    return;
  }

  render(
    <ErrorFrame title={input.title} subtitle={input.subtitle} meta={input.statusLabel}>
      <Box flexDirection="column">
        <Text color={theme.danger}>{input.statusLabel}</Text>
        <Text color={theme.text}>{input.message}</Text>
      </Box>
    </ErrorFrame>
  );
}
