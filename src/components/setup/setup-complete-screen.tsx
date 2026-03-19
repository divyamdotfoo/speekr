import { Box, Text, render } from "ink";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";

export function renderSetupCompleteScreen() {
  render(
    <AppFrame title="Setup complete" subtitle="setup">
      <Box marginBottom={1}>
        <Text color={theme.success}>●</Text>
        <Text color={theme.muted}>  </Text>
        <Text color={theme.text}>You are ready to start practicing.</Text>
      </Box>
      <Text color={theme.muted}>Next command:</Text>
      <Text color={theme.accent}>speekr record</Text>
    </AppFrame>,
  );
}
