import { platform } from "node:os";
import { spawn } from "node:child_process";

export function openUrl(url: string) {
  const command =
    platform() === "darwin"
      ? "open"
      : platform() === "win32"
      ? "start"
      : "xdg-open";

  spawn(command, [url], {
    detached: true,
    stdio: "ignore",
    shell: platform() === "win32",
  }).unref();
}

export function parsePort(value: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error("Port must be an integer between 1 and 65535.");
  }
  return parsed;
}
