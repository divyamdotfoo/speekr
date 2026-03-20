import { InvalidArgumentError, type Command } from "commander";
import type { CommandRegistrar } from "../types.ts";
import { renderCommandScreen } from "../../components/layout/command-screen.tsx";
import {
  resolveFfmpegExecutable,
  runInteractiveRecording,
  showMissingFfmpegNotice,
} from "./utils.ts";
import type { TranscriptionChoice } from "../../types/index.ts";

export const registerRecordCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("record")
    .description("Start a new learning session")
    .option(
      "-t, --transcription <mode>",
      "Override transcription mode for this run (local|https)",
      parseTranscriptionMode
    )
    .action(
      async (options: {
        transcription?: Exclude<TranscriptionChoice, null>;
      }) => {
      if (!process.stdin.isTTY) {
        renderCommandScreen({
          title: "Interactive terminal required",
          subtitle: "record",
          tone: "warning",
          statusLabel: "TTY unavailable",
          message: "Run `speekr record` from an interactive terminal session.",
        });
        return;
      }

      const ffmpegPath = resolveFfmpegExecutable();
      if (!ffmpegPath) {
        showMissingFfmpegNotice();
        return;
      }

      try {
        await runInteractiveRecording(ffmpegPath, {
          transcription: options.transcription,
        });
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : "Unknown recording error.";
        renderCommandScreen({
          title: "Recording failed",
          subtitle: "record",
          tone: "danger",
          statusLabel: "Capture aborted",
          message: detail,
        });
      }
      }
    );
};

function parseTranscriptionMode(value: string): Exclude<TranscriptionChoice, null> {
  const normalized = value.trim().toLowerCase();
  if (normalized === "local" || normalized === "https") {
    return normalized;
  }

  throw new InvalidArgumentError(
    'Transcription mode must be "local" or "https".'
  );
}
