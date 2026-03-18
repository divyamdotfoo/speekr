import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { ProficiencyLevel } from "../../types/index.ts";
import { theme } from "../theme/tokens.ts";

const proficiencyOptions: Array<{ label: string; value: ProficiencyLevel }> = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

export function ProficiencySelect({
  onSelect,
}: {
  onSelect: (value: ProficiencyLevel) => void;
}) {
  return (
    <Box flexDirection="column">
      <Text color={theme.muted}>Use arrow keys and Enter to choose.</Text>
      <SelectInput
        items={proficiencyOptions}
        onSelect={(item) => {
          onSelect(item.value);
        }}
      />
    </Box>
  );
}
