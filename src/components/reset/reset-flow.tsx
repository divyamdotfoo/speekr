import { Box, Text, render } from "ink";
import SelectInput from "ink-select-input";
import { AppFrame } from "../layout/app-frame.tsx";
import { theme } from "../theme/tokens.ts";

type ResetChoice = "yes" | "no";

const resetChoices: Array<{ label: string; value: ResetChoice }> = [
  { label: "Yes, reset everything", value: "yes" },
  { label: "No, keep my data", value: "no" },
];

function ResetConfirmation({
  onSelect,
}: {
  onSelect: (choice: ResetChoice) => void;
}) {
  return (
    <AppFrame title="Confirm reset" subtitle="reset">
      <Box flexDirection="column" marginBottom={1}>
        <Text color={theme.warning}>This will permanently delete:</Text>
        <Text color={theme.muted}>- Local database (`~/.speekr/speekr.db`)</Text>
        <Text color={theme.muted}>- All recordings (`~/.speekr/recordings`)</Text>
      </Box>

      <Text color={theme.text}>Proceed?</Text>
      <Box marginTop={1}>
        <SelectInput
          items={resetChoices}
          onSelect={(item) => {
            onSelect(item.value);
          }}
        />
      </Box>
    </AppFrame>
  );
}

export async function promptResetConfirmation(): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  return await new Promise<boolean>((resolve) => {
    const instance = render(
      <ResetConfirmation
        onSelect={(choice) => {
          instance.unmount();
          resolve(choice === "yes");
        }}
      />,
    );
  });
}

export function renderResetOutcomeScreen(input: {
  wasReset: boolean;
}) {
  render(
    <AppFrame title={input.wasReset ? "Reset complete" : "Reset cancelled"} subtitle="reset">
      {input.wasReset ? (
        <Box flexDirection="column">
          <Text color={theme.success}>Local database and recordings were removed.</Text>
          <Text color={theme.muted}>
            Run `speekr setup` (or any guarded command) to initialize again.
          </Text>
        </Box>
      ) : (
        <Text color={theme.muted}>No data was deleted.</Text>
      )}
    </AppFrame>,
  );
}
