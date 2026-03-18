import type { ReactNode } from "react";
import { Box, Text } from "ink";
import { theme } from "../theme/tokens.ts";

type MessageTone = "info" | "success" | "warning" | "danger";

const borderTone = {
  info: theme.brand,
  success: theme.success,
  warning: theme.warning,
  danger: theme.danger,
} as const;

export function MessagePanel({
  tone,
  title,
  children,
}: {
  tone: MessageTone;
  title: string;
  children: ReactNode;
}) {
  return (
    <Box
      borderStyle="single"
      borderColor={borderTone[tone]}
      flexDirection="column"
      paddingX={1}
      marginBottom={1}
    >
      <Text color={borderTone[tone]}>{title}</Text>
      <Box marginTop={1}>
        {typeof children === "string" ? (
          <Text color={theme.text}>{children}</Text>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
}
