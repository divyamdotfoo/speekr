import { EventEmitter } from "node:events";
import { spawn, type ChildProcessByStdio } from "node:child_process";
import { stat } from "node:fs/promises";
import type { Readable, Writable } from "node:stream";
import {
  AUDIO_RECORDING_CONFIG,
  RECORDING_SILENCE_CONFIG,
} from "../../constants/index.ts";
import type {
  RecordSession,
  RecordSessionResult,
  StopReason,
} from "../../types/index.ts";
import {
  analyzeRecordedVolume,
  getInputArgs,
  getInstallInstructionsForCurrentOs,
  looksLikeInputDeviceIssue,
  looksLikeInputPermissionIssue,
  resolveSystemFfmpegPath,
} from "./utils.ts";

const RECORDING_CHANNELS = AUDIO_RECORDING_CONFIG.channels;
const RECORDING_SAMPLE_RATE = AUDIO_RECORDING_CONFIG.sampleRate;
const RECORDING_CODEC = AUDIO_RECORDING_CONFIG.codec;
const RECORDING_FILTER = AUDIO_RECORDING_CONFIG.silenceFilter;
const SILENCE_WARNING_MS = RECORDING_SILENCE_CONFIG.silenceWarningMs;
const SILENCE_AUTO_STOP_MS = RECORDING_SILENCE_CONFIG.silenceAutoStopMs;
const SILENCE_HINT_INTERVAL_MS = RECORDING_SILENCE_CONFIG.silenceHintIntervalMs;

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
  let stopReason: StopReason | null = null;
  let warningTimer: NodeJS.Timeout | null = null;
  let autoStopTimer: NodeJS.Timeout | null = null;
  let hintInterval: NodeJS.Timeout | null = null;
  let silenceStartedAt: number | null = null;
  let stopTimeout: NodeJS.Timeout | null = null;
  let hasSilenceWindow = false;
  let hasStopped = false;
  const stderrLines: string[] = [];
  let recordingProcess: ChildProcessByStdio<Writable, null, Readable> | null =
    null;

  function clearSilenceTimers() {
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = null;
    }
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }
    if (hintInterval) {
      clearInterval(hintInterval);
      hintInterval = null;
    }
    silenceStartedAt = null;
    hasSilenceWindow = false;
  }

  function stop(reason: StopReason = "user") {
    if (!recordingProcess || hasStopped) {
      return;
    }

    hasStopped = true;
    stopReason = reason;
    if (recordingProcess.stdin.writable) {
      recordingProcess.stdin.write("q\n");
      recordingProcess.stdin.end();
    }

    stopTimeout = setTimeout(() => {
      recordingProcess?.kill("SIGINT");
    }, 2000);
  }

  function handleFfmpegSilence(line: string) {
    if (line.includes("silence_start")) {
      if (hasSilenceWindow) {
        return;
      }

      hasSilenceWindow = true;
      silenceStartedAt = Date.now();
      warningTimer = setTimeout(() => {
        events.emit("silence-warning", {
          secondsUntilAutoStop: Math.max(
            0,
            Math.ceil((SILENCE_AUTO_STOP_MS - SILENCE_WARNING_MS) / 1000)
          ),
        });
      }, SILENCE_WARNING_MS);
      hintInterval = setInterval(() => {
        if (!hasSilenceWindow || silenceStartedAt === null) {
          return;
        }
        events.emit("silence-hint-tick", {
          elapsedSilenceMs: Date.now() - silenceStartedAt,
        });
      }, SILENCE_HINT_INTERVAL_MS);
      autoStopTimer = setTimeout(() => {
        stop("silence_timeout");
      }, SILENCE_AUTO_STOP_MS);
      return;
    }

    if (line.includes("silence_end")) {
      if (!hasSilenceWindow) {
        return;
      }
      clearSilenceTimers();
      events.emit("silence-cleared", undefined);
    }
  }

  const result = new Promise<RecordSessionResult>((resolve, reject) => {
    let processHandle: ChildProcessByStdio<Writable, null, Readable>;
    try {
      processHandle = spawn(
        input.ffmpegPath,
        [
          "-hide_banner",
          "-loglevel",
          "info",
          ...getInputArgs(),
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

    processHandle.once("error", (error) => {
      clearSilenceTimers();
      if (stopTimeout) {
        clearTimeout(stopTimeout);
      }
      reject(error);
    });

    processHandle.once("close", async (code) => {
      clearSilenceTimers();
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
  });

  return {
    stop,
    result,
    on(event, listener) {
      events.on(event, listener as (...args: unknown[]) => void);
    },
    off(event, listener) {
      events.off(event, listener as (...args: unknown[]) => void);
    },
  };
}
