import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { ProficiencyLevel } from "../../types/index.ts";
import { theme } from "../theme/tokens.ts";

const proficiencyOptions: Array<{ label: string; value: ProficiencyLevel }> = [
  { label: "Beginner - building fundamentals", value: "beginner" },
  { label: "Intermediate - conversational and practical", value: "intermediate" },
  { label: "Advanced - fluent and nuanced", value: "advanced" },
];

export function ProficiencySelect({
  onSelect,
}: {
  onSelect: (value: ProficiencyLevel) => void;
}) {
  return (
    <Box flexDirection="column">
      <SelectInput
        items={proficiencyOptions}
        onSelect={(item) => {
          onSelect(item.value);
        }}
        indicatorComponent={({ isSelected }) => (
          <Text color={isSelected ? theme.accent : theme.muted}>
            {isSelected ? "● " : "○ "}
          </Text>
        )}
      />
    </Box>
  );
}
