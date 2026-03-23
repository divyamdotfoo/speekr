export function getSpinnerFrame(tick: number) {
  return SPINNER_FRAMES[tick % SPINNER_FRAMES.length];
}

export function formatClock(totalSeconds: number) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function buildFixedLogLines(logs: string[], lineCount: number) {
  const visible = logs.slice(-lineCount);
  const padCount = Math.max(0, lineCount - visible.length);
  const padding = new Array<string>(padCount).fill(" ");
  return [...padding, ...visible];
}

const SPINNER_FRAMES = ["◜◠◝", "◠◉◠", "◟◡◞", "◡◉◡"] as const;
