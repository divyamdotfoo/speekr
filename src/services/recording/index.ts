import { EventEmitter } from "node:events";
import { spawn, type ChildProcessByStdio } from "node:child_process";
import { stat } from "node:fs/promises";
import type { Readable, Writable } from "node:stream";
import { AUDIO_RECORDING_CONFIG } from "../../constants/index.ts";
import type {
  RecordSession,
  RecordSessionPhase,
  RecordingStatus,
  RecordSessionResult,
  StopReason,
} from "../../types/index.ts";
import {
  analyzeRecordedVolume,
  getInstallInstructionsForCurrentOs,
  getSilenceFilter,
  looksLikeInputDeviceIssue,
  looksLikeInputPermissionIssue,
  resolveInputArgs,
  resolveSystemFfmpegPath,
} from "./utils.ts";

const RECORDING_CHANNELS = AUDIO_RECORDING_CONFIG.channels;
const RECORDING_SAMPLE_RATE = AUDIO_RECORDING_CONFIG.sampleRate;
const RECORDING_CODEC = AUDIO_RECORDING_CONFIG.codec;
const RECORDING_FILTER = getSilenceFilter();

export function resolveFfmpegExecutable() {
  return resolveSystemFfmpegPath();
}

export function getFfmpegInstallInstructions() {
  return getInstallInstructionsForCurrentOs();
}

export function getRecordingQualitySummary() {
  return `Quality: ${RECORDING_CODEC} @ ${RECORDING_SAMPLE_RATE}Hz, ${RECORDING_CHANNELS} channel(s).`;
}

export function createRecordSession(input: {
  ffmpegPath: string;
  outputPath: string;
}): RecordSession {
  const events = new EventEmitter();
  const startedAt = Date.now();
  let phase: RecordSessionPhase = "starting";
  let stopReason: StopReason | null = null;
  let stopTimeout: NodeJS.Timeout | null = null;
  let hasStopped = false;
  let status: RecordingStatus = "speaking";
  const stderrLines: string[] = [];
  let recordingProcess: ChildProcessByStdio<Writable, null, Readable> | null =
    null;

  function stop(reason: StopReason = "user") {
    if (hasStopped) {
      return;
    }

    hasStopped = true;
    stopReason = reason;
    if (!recordingProcess) {
      return;
    }
    if (recordingProcess.stdin.writable) {
      recordingProcess.stdin.write("q\n");
      recordingProcess.stdin.end();
    }

    stopTimeout = setTimeout(() => {
      recordingProcess?.kill("SIGINT");
    }, 2000);
  }

  function handleFfmpegSilence(line: string): void {
    if (line.includes("silence_start")) {
      if (status === "silent") {
        return;
      }
      status = "silent";
      events.emit("status-change", "silent");
      return;
    }

    if (line.includes("silence_end")) {
      if (status === "speaking") {
        return;
      }
      status = "speaking";
      events.emit("status-change", "speaking");
    }
  }

  const result = new Promise<RecordSessionResult>((resolve, reject) => {
    setTimeout(() => {
      let processHandle: ChildProcessByStdio<Writable, null, Readable>;
      try {
        processHandle = spawn(
          input.ffmpegPath,
          [
            "-hide_banner",
            "-loglevel",
            "info",
            ...resolveInputArgs(input.ffmpegPath),
            "-af",
            RECORDING_FILTER,
            "-ac",
            RECORDING_CHANNELS,
            "-c:a",
            RECORDING_CODEC,
            "-ar",
            RECORDING_SAMPLE_RATE,
            "-y",
            input.outputPath,
          ],
          {
            stdio: ["pipe", "ignore", "pipe"],
          }
        );
      } catch (error) {
        reject(error);
        return;
      }

      recordingProcess = processHandle;
      phase = "recording";
      events.emit("phase-change", phase);

      if (hasStopped) {
        stop(stopReason ?? "user");
      }

      processHandle.stderr.setEncoding("utf8");
      processHandle.stderr.on("data", (chunk: string) => {
        for (const line of chunk.split(/\r?\n/)) {
          if (!line.trim()) {
            continue;
          }
          stderrLines.push(line);
          if (stderrLines.length > 80) {
            stderrLines.shift();
          }
          handleFfmpegSilence(line);
        }
      });
      events.emit("status-change", "speaking");

      processHandle.once("error", (error) => {
        if (stopTimeout) {
          clearTimeout(stopTimeout);
        }
        reject(error);
      });

      processHandle.once("close", async (code) => {
        if (stopTimeout) {
          clearTimeout(stopTimeout);
        }

        if (code !== 0 && !hasStopped) {
          const logs = stderrLines.join("\n");
          if (looksLikeInputPermissionIssue(logs)) {
            reject(
              new Error(
                "Microphone permission appears to be blocked. Grant microphone access to your terminal app and retry."
              )
            );
            return;
          }
          if (looksLikeInputDeviceIssue(logs)) {
            reject(
              new Error(
                "Audio input device could not be opened. Check your default microphone and retry."
              )
            );
            return;
          }
          reject(new Error(`ffmpeg exited with code ${String(code)}.`));
          return;
        }

        try {
          const file = await stat(input.outputPath);
          if (file.size === 0) {
            reject(
              new Error(
                "Recording was empty. Please check microphone permissions."
              )
            );
            return;
          }
          if (file.size < 4096) {
            reject(
              new Error(
                "Recording file is too small and likely contains no voice input. Check microphone permissions and selected input device."
              )
            );
            return;
          }
        } catch (error) {
          reject(error);
          return;
        }

        const volume = analyzeRecordedVolume(input.ffmpegPath, input.outputPath);
        if (volume.shouldRejectAsSilent) {
          reject(
            new Error(
              `Captured audio is near-silent (max volume: ${volume.maxVolumeDb} dB). Check mic permissions and default input device.`
            )
          );
          return;
        }

        resolve({
          outputPath: input.outputPath,
          durationMs: Date.now() - startedAt,
          stopReason: stopReason ?? "user",
        });
      });
    }, 0);
  });

  return {
    stop,
    result,
    on(event, listener) {
      events.on(event, listener as (...args: unknown[]) => void);
      if (event === "phase-change") {
        (listener as (value: RecordSessionPhase) => void)(phase);
      }
    },
    off(event, listener) {
      events.off(event, listener as (...args: unknown[]) => void);
    },
  };
}
