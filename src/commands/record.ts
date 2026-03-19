import type { Command } from "commander";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { render } from "ink";
import { createElement } from "react";
import { renderCommandScreen } from "../components/layout/command-screen.tsx";
import { renderRecordingSavedScreen } from "../components/recording/recording-saved-screen.tsx";
import { RecordingSessionScreen } from "../components/recording/recording-session-screen.tsx";
import {
  getInstallInstructionsForCurrentOs,
  resolveSystemFfmpegPath,
} from "./ffmpeg-check.ts";
import {
  createRecordSession,
  type RecordSessionResult,
} from "./record-session.ts";
import type { CommandRegistrar } from "./types.ts";
import { RECORDINGS_DIRECTORY_PATH } from "../db/client.ts";

function buildRecordingFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `recording-${stamp}.wav`;
}

function resolveFfmpegExecutable() {
  return resolveSystemFfmpegPath();
}

function showMissingFfmpegNotice() {
  const instructions = getInstallInstructionsForCurrentOs();
  const formatted = instructions.map((line) => `- ${line}`).join("\n");
  renderCommandScreen({
    title: "ffmpeg not found",
    subtitle: "record",
    tone: "warning",
    statusLabel: "Dependency required",
    message: `Install ffmpeg and retry:\n${formatted}`,
  });
}

async function runInteractiveRecording(ffmpegPath: string) {
  await mkdir(RECORDINGS_DIRECTORY_PATH, { recursive: true });
  const outputPath = join(RECORDINGS_DIRECTORY_PATH, buildRecordingFileName());
  const session = createRecordSession({
    ffmpegPath,
    outputPath,
  });

  const result = await new Promise<RecordSessionResult>((resolve, reject) => {
    const instance = render(createElement(RecordingSessionScreen, { session }));
    session.result
      .then((value) => {
        instance.unmount();
        resolve(value);
      })
      .catch((error) => {
        instance.unmount();
        reject(error);
      });
  });

  renderRecordingSavedScreen({
    outputPath: result.outputPath,
    statusLabel:
      result.stopReason === "silence_timeout"
        ? "Stopped after prolonged silence"
        : "Capture complete",
    qualitySummary: `Quality: ${process.env.SPEEKR_AUDIO_CODEC?.trim() || "pcm_s16le"} @ ${process.env.SPEEKR_AUDIO_SAMPLE_RATE?.trim() || "48000"}Hz, ${process.env.SPEEKR_AUDIO_CHANNELS?.trim() || "1"} channel(s).`,
  });
}

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
