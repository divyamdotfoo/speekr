import { Box, Text } from "ink";
import { useMemo } from "react";
import { theme } from "../theme/tokens.ts";
import type { RecordingStatus } from "../../types/index.ts";

export function BrailleVoiceIndicator(input: {
  status: RecordingStatus;
  tick: number;
  width?: number;
}) {
  const width = Math.max(8, input.width ?? 28);
  const pattern = useMemo(() => {
    return input.status === "speaking"
      ? buildSpeakingPattern(width, input.tick)
      : buildSilentPattern(width);
  }, [input.status, input.tick, width]);
  const color = input.status === "speaking" ? theme.success : theme.muted;

  return (
    <Box>
      <Text color={color}>{pattern}</Text>
    </Box>
  );
}

function buildSilentPattern(width: number): string {
  const start = "⢾";
  const middle = "⣀".repeat(Math.max(0, width - 2));
  const end = "⡷";
  return `${start}${middle}${end}`;
}

function buildSpeakingPattern(width: number, tick: number): string {
  const start = "⢾";
  const end = "⡷";
  const cells = Math.max(0, width - 2);
  let pattern = "";

  for (let index = 0; index < cells; index += 1) {
    const waveA = Math.sin((index + tick * 0.9) * 0.7);
    const waveB = Math.cos((index * 1.3 + tick * 0.5) * 0.6);
    const energy = Math.abs(waveA * 0.65 + waveB * 0.35);
    pattern += BRAILLE_LEVELS[Math.min(4, Math.floor(energy * 5))];
  }

  return `${start}${pattern}${end}`;
}

const BRAILLE_LEVELS = ["⣀", "⣄", "⣤", "⣶", "⣿"] as const;
