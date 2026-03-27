import { spawnSync } from "node:child_process";
import { accessSync, constants as fsConstants } from "node:fs";
import { AUDIO_INPUT_DEFAULTS, AUDIO_RECORDING_CONFIG } from "../../constants/index.ts";

type ProbeResult = {
  ok: boolean;
  path: string | null;
};

export function getInstallInstructionsForCurrentOs(): string[] {
  switch (process.platform) {
    case "darwin":
      return [
        "Install with Homebrew: brew install ffmpeg",
        "If Homebrew is missing, install it first from https://brew.sh",
      ];
    case "linux":
      return [
        "Ubuntu/Debian: sudo apt update && sudo apt install -y ffmpeg",
        "Fedora: sudo dnf install ffmpeg",
        "Arch: sudo pacman -S ffmpeg",
      ];
    case "win32":
      return [
        "Chocolatey: choco install ffmpeg",
        "Scoop: scoop install ffmpeg",
        "Then restart terminal so PATH picks up ffmpeg",
      ];
    default:
      return [
        "Install ffmpeg for your operating system and ensure `ffmpeg` is in PATH.",
      ];
  }
}

export function resolveSystemFfmpegPath(): string | null {
  const fromPath = probeFromPathEnv();
  if (fromPath.ok && fromPath.path) {
    return fromPath.path;
  }

  const fromLocator = probeFromLocator();
  if (fromLocator.ok && fromLocator.path) {
    return fromLocator.path;
  }

  const fromCommonLocations = probeCommonLocations();
  if (fromCommonLocations.ok && fromCommonLocations.path) {
    return fromCommonLocations.path;
  }

  return null;
}

export function resolveInputArgs(ffmpegPath: string): string[] {
  if (process.platform === "darwin") {
    const detected = detectMacInputDevice(ffmpegPath);
    return ["-f", "avfoundation", "-i", detected ?? AUDIO_INPUT_DEFAULTS.darwin];
  }

  if (process.platform === "win32") {
    const detected = detectWindowsInputDevice(ffmpegPath);
    return ["-f", "dshow", "-i", detected ?? AUDIO_INPUT_DEFAULTS.win32];
  }

  if (process.platform === "linux") {
    return ["-f", "pulse", "-i", AUDIO_INPUT_DEFAULTS.linux];
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

export function getSilenceFilter(): string {
  return `silencedetect=n=${AUDIO_RECORDING_CONFIG.silenceThresholdDb}dB:d=${AUDIO_RECORDING_CONFIG.silenceDurationSec}`;
}

function canExecuteAt(pathOrCommand: string): boolean {
  const probe = spawnSync(pathOrCommand, ["-version"], { stdio: "ignore" });
  return probe.status === 0;
}

function probeFromPathEnv(): ProbeResult {
  if (canExecuteAt("ffmpeg")) {
    return { ok: true, path: "ffmpeg" };
  }
  return { ok: false, path: null };
}

function probeFromLocator(): ProbeResult {
  const locator = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(locator, ["ffmpeg"], { encoding: "utf8" });
  if (result.status !== 0 || !result.stdout) {
    return { ok: false, path: null };
  }

  const candidates = result.stdout
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    if (canExecuteAt(candidate)) {
      return { ok: true, path: candidate };
    }
  }

  return { ok: false, path: null };
}

function probeCommonLocations(): ProbeResult {
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
          "C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe",
        ]
      : [
          "/opt/homebrew/bin/ffmpeg",
          "/usr/local/bin/ffmpeg",
          "/usr/bin/ffmpeg",
        ];

  for (const candidate of candidates) {
    try {
      accessSync(candidate, fsConstants.X_OK);
      if (canExecuteAt(candidate)) {
        return { ok: true, path: candidate };
      }
    } catch {
      // Ignore missing candidate path.
    }
  }

  return { ok: false, path: null };
}

export function looksLikeInputPermissionIssue(log: string): boolean {
  const normalized = log.toLowerCase();
  return (
    normalized.includes("permission denied") ||
    normalized.includes("operation not permitted") ||
    normalized.includes("not authorized") ||
    normalized.includes("cannot open audio device")
  );
}

export function looksLikeInputDeviceIssue(log: string): boolean {
  const normalized = log.toLowerCase();
  return (
    normalized.includes("could not find audio device") ||
    normalized.includes("input device") ||
    normalized.includes("device not found") ||
    normalized.includes("error opening input")
  );
}

export function analyzeRecordedVolume(
  ffmpegPath: string,
  outputPath: string
): {
  shouldRejectAsSilent: boolean;
  maxVolumeDb: number | null;
} {
  const analysis = spawnSync(
    ffmpegPath,
    [
      "-hide_banner",
      "-i",
      outputPath,
      "-af",
      "volumedetect",
      "-f",
      "null",
      "-",
    ],
    { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" }
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
    shouldRejectAsSilent:
      maxVolumeDb <= AUDIO_RECORDING_CONFIG.rejectVolumeBelowDb,
    maxVolumeDb,
  };
}

function detectMacInputDevice(ffmpegPath: string): string | null {
  const probe = spawnSync(
    ffmpegPath,
    ["-f", "avfoundation", "-list_devices", "true", "-i", ""],
    { encoding: "utf8" }
  );
  const combined = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`;
  const deviceLines = combined
    .split(/\r?\n/)
    .filter((line) => /\[\d+\]/.test(line) && /microphone/i.test(line));
  if (deviceLines.length === 0) {
    return null;
  }

  const preferred =
    deviceLines.find((line) => /built-in|macbook/i.test(line)) ?? deviceLines[0];
  if (!preferred) {
    return null;
  }
  const match = preferred.match(/\[(\d+)\]/);
  if (!match) {
    return null;
  }
  return `:${match[1]}`;
}

function detectWindowsInputDevice(ffmpegPath: string): string | null {
  const probe = spawnSync(
    ffmpegPath,
    ["-f", "dshow", "-list_devices", "true", "-i", "dummy"],
    { encoding: "utf8" }
  );
  const combined = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`;
  const matches = Array.from(combined.matchAll(/"([^"]+)"/g), (m) => m[1]).filter(
    (value): value is string => Boolean(value)
  );
  if (matches.length === 0) {
    return null;
  }

  const preferred =
    matches.find((name) => /microphone/i.test(name)) ?? matches[0];
  if (!preferred) {
    return null;
  }
  return `audio="${preferred}"`;
}
