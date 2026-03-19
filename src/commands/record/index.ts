import type { Command } from "commander";
import type { CommandRegistrar } from "../types.ts";
import { renderCommandScreen } from "../../components/layout/command-screen.tsx";
import {
  resolveFfmpegExecutable,
  runInteractiveRecording,
  showMissingFfmpegNotice,
} from "./utils.ts";

export const registerRecordCommand: CommandRegistrar = (program: Command) => {
  return program
    .command("record")
    .description("Start a new learning session")
    .action(async () => {
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
        await runInteractiveRecording(ffmpegPath);
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
    });
};
