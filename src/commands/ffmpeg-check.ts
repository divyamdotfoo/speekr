import { accessSync, constants as fsConstants } from "node:fs";
import { spawnSync } from "node:child_process";

type ProbeResult = {
  ok: boolean;
  path: string | null;
};

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
      : ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"];

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
