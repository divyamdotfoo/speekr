import { EventEmitter } from "node:events";
import { spawn, spawnSync, type ChildProcessByStdio } from "node:child_process";
import { stat } from "node:fs/promises";
import type { Readable, Writable } from "node:stream";
import { AUDIO_RECORDING_CONFIG } from "../../constants/config.ts";
import {
  getInstallInstructionsForCurrentOs,
  resolveSystemFfmpegPath,
} from "./utils.ts";

export type StopReason = "user" | "silence_timeout";

const RECORDING_CHANNELS = AUDIO_RECORDING_CONFIG.channels;
const RECORDING_SAMPLE_RATE = AUDIO_RECORDING_CONFIG.sampleRate;
const RECORDING_CODEC = AUDIO_RECORDING_CONFIG.codec;
const RECORDING_FILTER = AUDIO_RECORDING_CONFIG.silenceFilter;

export type RecordSessionResult = {
  outputPath: string;
  durationMs: number;
  stopReason: StopReason;
};

type RecordSessionEventMap = {
  "silence-warning": { secondsUntilAutoStop: number };
  "silence-cleared": undefined;
};

export type RecordSession = {
  stop: (reason?: StopReason) => void;
  result: Promise<RecordSessionResult>;
  on: <K extends keyof RecordSessionEventMap>(
    event: K,
    listener: (payload: RecordSessionEventMap[K]) => void,
  ) => void;
  off: <K extends keyof RecordSessionEventMap>(
    event: K,
    listener: (payload: RecordSessionEventMap[K]) => void,
  ) => void;
};

export function resolveFfmpegExecutable() {
  return resolveSystemFfmpegPath();
}

export function getFfmpegInstallInstructions() {
  return getInstallInstructionsForCurrentOs();
}

export function getRecordingQualitySummary() {
  return `Quality: ${RECORDING_CODEC} @ ${RECORDING_SAMPLE_RATE}Hz, ${RECORDING_CHANNELS} channel(s).`;
}

function getInputArgs() {
  const requestedDevice = AUDIO_RECORDING_CONFIG.inputDevice;

  switch (process.platform) {
    case "darwin":
      // Use AVFoundation's default audio alias unless user overrides it.
      return ["-f", "avfoundation", "-i", `:${requestedDevice || "default"}`];
    case "linux":
      return ["-f", "pulse", "-i", requestedDevice || "default"];
    case "win32":
      return ["-f", "dshow", "-i", `audio=${requestedDevice || "default"}`];
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

function looksLikeInputPermissionIssue(log: string): boolean {
  const normalized = log.toLowerCase();
  return (
    normalized.includes("permission denied") ||
    normalized.includes("operation not permitted") ||
    normalized.includes("not authorized") ||
    normalized.includes("cannot open audio device")
  );
}

function looksLikeInputDeviceIssue(log: string): boolean {
  const normalized = log.toLowerCase();
  return (
    normalized.includes("could not find audio device") ||
    normalized.includes("input device") ||
    normalized.includes("device not found") ||
    normalized.includes("error opening input")
  );
}

function analyzeRecordedVolume(ffmpegPath: string, outputPath: string): {
  shouldRejectAsSilent: boolean;
  maxVolumeDb: number | null;
} {
  const analysis = spawnSync(
    ffmpegPath,
    ["-hide_banner", "-i", outputPath, "-af", "volumedetect", "-f", "null", "-"],
    { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" },
  );

  if (analysis.status !== 0 || !analysis.stderr) {
    return { shouldRejectAsSilent: false, maxVolumeDb: null };
  }

  const match = analysis.stderr.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/i);
  if (!match) {
    return { shouldRejectAsSilent: false, maxVolumeDb: null };
  }

  const maxVolumeDb = Number(match[1]);
  if (Number.isNaN(maxVolumeDb)) {
    return { shouldRejectAsSilent: false, maxVolumeDb: null };
  }

  return {
    shouldRejectAsSilent: maxVolumeDb <= -45,
    maxVolumeDb,
  };
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
  let stopTimeout: NodeJS.Timeout | null = null;
  let hasSilenceWindow = false;
  let hasStopped = false;
  const stderrLines: string[] = [];
  let recordingProcess: ChildProcessByStdio<Writable, null, Readable> | null = null;

  function clearSilenceTimers() {
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = null;
    }
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }
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
      warningTimer = setTimeout(() => {
        events.emit("silence-warning", { secondsUntilAutoStop: 10 });
      }, 20_000);
      autoStopTimer = setTimeout(() => {
        stop("silence_timeout");
      }, 30_000);
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
        },
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
              "Microphone permission appears to be blocked. Grant microphone access to your terminal app and retry.",
            ),
          );
          return;
        }
        if (looksLikeInputDeviceIssue(logs)) {
          reject(
            new Error(
              "Audio input device could not be opened. Check your default microphone and retry.",
            ),
          );
          return;
        }
        reject(new Error(`ffmpeg exited with code ${String(code)}.`));
        return;
      }

      try {
        const file = await stat(input.outputPath);
        if (file.size === 0) {
          reject(new Error("Recording was empty. Please check microphone permissions."));
          return;
        }
        if (file.size < 4096) {
          reject(
            new Error(
              "Recording file is too small and likely contains no voice input. Check microphone permissions and selected input device.",
            ),
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
            `Captured audio is near-silent (max volume: ${volume.maxVolumeDb} dB). Check mic permissions and default input device.`,
          ),
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
