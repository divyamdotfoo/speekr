import type { PropsWithChildren } from "react";
import { Box, Text } from "ink";
import { glyphs, theme } from "../theme/tokens.ts";

type AppFrameProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  meta?: string;
}>;

export function AppFrame({ title, subtitle, meta, children }: AppFrameProps) {
  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box
        borderStyle="round"
        borderColor={theme.brand}
        flexDirection="column"
        paddingX={2}
        paddingY={1}
      >
        <Box marginBottom={1} justifyContent="space-between">
          <Box>
            <Text color={theme.accent}>◤ </Text>
            <Text color={theme.brand}>{glyphs.brand} SPEEKR</Text>
            <Text color={theme.muted}> / </Text>
            <Text color={theme.text}>{title}</Text>
            {subtitle ? (
              <>
                <Text color={theme.muted}> / </Text>
                <Text color={theme.accent}>{subtitle}</Text>
              </>
            ) : null}
          </Box>
          {meta ? <Text color={theme.muted}>[{meta}]</Text> : null}
        </Box>
        {children}
      </Box>
    </Box>
  );
}
