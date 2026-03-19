import { spawnSync } from "node:child_process";
import { accessSync, constants as fsConstants } from "node:fs";
import { AUDIO_RECORDING_CONFIG } from "../../constants/config.ts";

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

export function getInputArgs() {
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
    shouldRejectAsSilent: maxVolumeDb <= -45,
    maxVolumeDb,
  };
}
