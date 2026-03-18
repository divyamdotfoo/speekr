import { Box, Text } from "ink";
import { glyphs, theme } from "../theme/tokens.ts";

type BadgeTone = "success" | "warning" | "danger" | "info";

const toneColor = {
  success: theme.success,
  warning: theme.warning,
  danger: theme.danger,
  info: theme.brand,
} as const;

export function StatusBadge({
  tone,
  label,
}: {
  tone: BadgeTone;
  label: string;
}) {
  return (
    <Box>
      <Text color={toneColor[tone]}>
        {glyphs[tone]} {label}
      </Text>
    </Box>
  );
}
