import type { PropsWithChildren } from "react";
import { Box, Text } from "ink";
import { glyphs, theme } from "../theme/tokens.ts";

type AppFrameProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
}>;

export function AppFrame({ title, subtitle, children }: AppFrameProps) {
  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box
        borderStyle="round"
        borderColor={theme.muted}
        flexDirection="column"
        paddingX={2}
        paddingY={1}
      >
        <Box marginBottom={1}>
          <Text color={theme.brand}>
            {glyphs.brand} SPEEKR
          </Text>
          <Text color={theme.muted}>  /  </Text>
          <Text color={theme.text}>{title}</Text>
          {subtitle ? (
            <>
              <Text color={theme.muted}>  -  </Text>
              <Text color={theme.muted}>{subtitle}</Text>
            </>
          ) : null}
        </Box>
        {children}
      </Box>
    </Box>
  );
}
