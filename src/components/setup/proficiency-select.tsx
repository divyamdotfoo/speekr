import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { ProficiencyLevel } from "../../types/index.ts";
import { theme } from "../theme/tokens.ts";

const proficiencyOptions: Array<{ label: string; value: ProficiencyLevel }> =
  Array.from({ length: 10 }, (_, i) => {
    const value = i + 1;
    return { label: String(value), value };
  });

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
