import type { PropsWithChildren } from "react";
import { Box, Text } from "ink";
import { glyphs, theme } from "../theme/tokens.ts";

type ErrorFrameProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  meta?: string;
}>;

export function ErrorFrame({ title, subtitle, meta, children }: ErrorFrameProps) {
  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box
        borderStyle="round"
        borderColor={theme.danger}
        flexDirection="column"
        paddingX={2}
        paddingY={1}
      >
        <Box marginBottom={1} justifyContent="space-between">
          <Box>
            <Text color={theme.danger}>◤ </Text>
            <Text color={theme.danger}>
              {glyphs.danger} SPEEKR
            </Text>
            <Text color={theme.muted}>  /  </Text>
            <Text color={theme.text}>{title}</Text>
            {subtitle ? (
              <>
                <Text color={theme.muted}>  /  </Text>
                <Text color={theme.warning}>{subtitle}</Text>
              </>
            ) : null}
          </Box>
          {meta ? <Text color={theme.muted}>[{meta}]</Text> : null}
        </Box>
        <Box marginBottom={1}>
          <Text color={theme.danger}>────────────────────────────────────────</Text>
        </Box>
        {children}
      </Box>
    </Box>
  );
}
