import { spawn, spawnSync } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findUpSync } from "find-up";
import { DATABASE_DIRECTORY_PATH } from "../../db/client.ts";
import { TRANSCRIPTION_CONFIG } from "../../constants/config.ts";

export type RuntimeSetupStep =
  | "checking"
  | "creating_venv"
  | "upgrading_pip"
  | "installing_packages"
  | "complete";

export type RuntimeSetupEvent = {
  step: RuntimeSetupStep;
  message: string;
  progressBar: string;
  percent: number | null;
  isIndeterminate?: boolean;
  stageLabel?: string;
  hint?: string;
};

export type TranscriptionProgressStep =
  | "starting"
  | "loading_model"
  | "transcribing"
  | "writing_output"
  | "complete";

export type TranscriptionProgressEvent = {
  step: TranscriptionProgressStep;
  message: string;
  progressBar: string;
  percent: number | null;
  isIndeterminate?: boolean;
  stageLabel?: string;
  hint?: string;
};

export type TranscriptionResult = {
  text: string;
  language: string | null;
  transcriptPath: string;
};

export function getTranscriptionHelperScriptPath() {
  const packageJsonPath = findUpSync("package.json", {
    cwd: dirname(fileURLToPath(import.meta.url)),
  });
  if (!packageJsonPath) {
    throw new Error("Could not locate package root for transcription assets.");
  }
  return join(dirname(packageJsonPath), "assets", "transcribe_helper.py");
}

export async function ensureTranscriptionRuntime(input?: {
  onEvent?: (event: RuntimeSetupEvent) => void;
  onLog?: (line: string) => void;
}) {
  const onEvent = input?.onEvent;
  const onLog = input?.onLog;
  onEvent?.({
    step: "checking",
    message: "Checking Python runtime and virtual environment.",
    progressBar: buildProgressBar(null),
    percent: null,
    isIndeterminate: true,
    stageLabel: "Checking runtime",
    hint: "We install local dependencies only once so transcription works fully offline.",
  });

  const pythonCommand = resolvePythonCommand();
  if (!pythonCommand) {
    throw new Error(
      "Python 3 was not found. Install Python 3.9+ and run `speekr setup` again.",
    );
  }

  await mkdir(TRANSCRIPTION_RUNTIME_DIR, { recursive: true });

  const hasVirtualEnvironment = await pathExists(VENV_PYTHON_PATH);
  const hasRuntimeMarker = await pathExists(TRANSCRIPTION_RUNTIME_MARKER_PATH);
  if (!hasVirtualEnvironment) {
    onEvent?.({
      step: "creating_venv",
      message: "Creating isolated Python environment.",
      progressBar: buildProgressBar(null),
      percent: null,
      isIndeterminate: true,
      stageLabel: "Creating virtual environment",
      hint: "This is a one-time setup step.",
    });
    await runCommand({
      command: pythonCommand,
      args: ["-m", "venv", TRANSCRIPTION_RUNTIME_DIR],
      heartbeatMs: 1200,
      onLine(line) {
        onLog?.(line);
        const percent = extractPercentFromLine(line);
        onEvent?.({
          step: "creating_venv",
          message: "Creating isolated Python environment.",
          progressBar: buildProgressBar(percent),
          percent,
          isIndeterminate: percent === null,
          stageLabel: "Creating virtual environment",
        });
      },
      onHeartbeat: () => {
        onEvent?.({
          step: "creating_venv",
          message: "Creating isolated Python environment.",
          progressBar: buildProgressBar(null),
          percent: null,
          isIndeterminate: true,
          stageLabel: "Creating virtual environment",
        });
      },
    });
  }

  if (!hasRuntimeMarker) {
    onEvent?.({
      step: "upgrading_pip",
      message: "Upgrading pip in the virtual environment.",
      progressBar: buildProgressBar(null),
      percent: null,
      isIndeterminate: true,
      stageLabel: "Upgrading pip",
    });
    await runCommand({
      command: VENV_PYTHON_PATH,
      args: ["-m", "pip", "install", "--upgrade", "pip", "--progress-bar", "on"],
      heartbeatMs: 1200,
      onLine(line) {
        onLog?.(line);
        const percent = extractPercentFromLine(line);
        onEvent?.({
          step: "upgrading_pip",
          message: "Upgrading pip in the virtual environment.",
          progressBar: buildProgressBar(percent),
          percent,
          isIndeterminate: percent === null,
          stageLabel: "Upgrading pip",
        });
      },
      onHeartbeat: () => {
        onEvent?.({
          step: "upgrading_pip",
          message: "Upgrading pip in the virtual environment.",
          progressBar: buildProgressBar(null),
          percent: null,
          isIndeterminate: true,
          stageLabel: "Upgrading pip",
        });
      },
    });

    onEvent?.({
      step: "installing_packages",
      message: "Installing speech transcription dependencies.",
      progressBar: buildProgressBar(null),
      percent: null,
      isIndeterminate: true,
      stageLabel: "Installing dependencies",
      hint: "This may take a few minutes on slower networks.",
    });
    await runCommand({
      command: VENV_PYTHON_PATH,
      args: ["-m", "pip", "install", "faster-whisper", "--progress-bar", "on"],
      heartbeatMs: 1200,
      onLine(line) {
        onLog?.(line);
        const percent = extractPercentFromLine(line);
        onEvent?.({
          step: "installing_packages",
          message: "Installing speech transcription dependencies.",
          progressBar: buildProgressBar(percent),
          percent,
          isIndeterminate: percent === null,
          stageLabel: "Installing dependencies",
        });
      },
      onHeartbeat: () => {
        onEvent?.({
          step: "installing_packages",
          message: "Installing speech transcription dependencies.",
          progressBar: buildProgressBar(null),
          percent: null,
          isIndeterminate: true,
          stageLabel: "Installing dependencies",
          hint: "This may take a few minutes on slower networks.",
        });
      },
    });

    await writeFile(TRANSCRIPTION_RUNTIME_MARKER_PATH, "ready\n", "utf8");
  }

  onEvent?.({
    step: "complete",
    message: "Python transcription runtime is ready.",
    progressBar: buildProgressBar(100),
    percent: 100,
    isIndeterminate: false,
    stageLabel: "Completed",
  });
}

export async function transcribeRecording(input: {
  audioPath: string;
  model?: string;
  languageCode?: string;
  onEvent?: (event: TranscriptionProgressEvent) => void;
  onLog?: (line: string) => void;
}) {
  const { audioPath, model = DEFAULT_MODEL, languageCode, onEvent, onLog } = input;
  onEvent?.({
    step: "starting",
    message: "Preparing transcription process.",
    progressBar: buildProgressBar(null),
    percent: null,
    isIndeterminate: true,
    stageLabel: "Preparing process",
  });

  const helperScript = getTranscriptionHelperScriptPath();
  if (!(await pathExists(helperScript))) {
    throw new Error(
      "Transcription helper script is missing from the package assets.",
    );
  }

  const hasVenvPython = await pathExists(VENV_PYTHON_PATH);
  const hasRuntimeMarker = await pathExists(TRANSCRIPTION_RUNTIME_MARKER_PATH);
  if (!hasVenvPython || !hasRuntimeMarker) {
    await ensureTranscriptionRuntime({
      onEvent: (runtimeEvent) => {
        onEvent?.({
          step: "starting",
          message: runtimeEvent.message,
          progressBar: runtimeEvent.progressBar,
          percent: runtimeEvent.percent,
          isIndeterminate: runtimeEvent.isIndeterminate,
          stageLabel: runtimeEvent.stageLabel ?? "Preparing runtime",
          hint: runtimeEvent.hint,
        });
      },
      onLog,
    });
  }

  await mkdir(TRANSCRIPTION_MODELS_DIRECTORY, { recursive: true });
  const modelMarkerPath = getModelReadyMarkerPath(model);
  const isFirstModelRun = !(await pathExists(modelMarkerPath));
  let activeProgressStep: TranscriptionProgressStep = "loading_model";
  const loadingHint = isFirstModelRun
    ? "Model loading can take time on first run while files download and warm up."
    : "Model loading can take a little time depending on your machine.";

  const rawOutput = await runCommand({
    command: VENV_PYTHON_PATH,
    args: [
      helperScript,
      "--audio",
      audioPath,
      "--model",
      model,
      ...(isFirstModelRun ? ["--first-run"] : []),
      ...(languageCode ? ["--language", languageCode] : []),
    ],
    heartbeatMs: 1400,
    onHeartbeat: () => {
      if (activeProgressStep === "loading_model") {
        onEvent?.({
          step: "loading_model",
          message: "Loading model files.",
          progressBar: buildProgressBar(null),
          percent: null,
          isIndeterminate: true,
          stageLabel: "Loading model",
          hint: loadingHint,
        });
        return;
      }
      if (activeProgressStep === "transcribing") {
        onEvent?.({
          step: "transcribing",
          message: "Transcribing audio.",
          progressBar: buildProgressBar(null),
          percent: null,
          isIndeterminate: true,
          stageLabel: "Transcribing audio",
        });
        return;
      }
      if (activeProgressStep === "writing_output") {
        onEvent?.({
          step: "writing_output",
          message: "Saving transcript file.",
          progressBar: buildProgressBar(null),
          percent: null,
          isIndeterminate: true,
          stageLabel: "Saving transcript",
        });
      }
    },
    onLine: (line) => {
      onLog?.(line);
      const progress = parseHelperProgressLine(line);
      if (!progress) {
        return;
      }
      activeProgressStep = progress.step;
      onEvent?.({
        step: progress.step,
        message: progress.message,
        progressBar: buildProgressBar(progress.percent),
        percent: progress.percent,
        isIndeterminate: progress.percent === null || progress.step === "loading_model",
        stageLabel: getTranscriptionStageLabel(progress.step),
        hint: progress.step === "loading_model" ? loadingHint : undefined,
      });
    },
  });

  let parsed: {
    success: boolean;
    text?: string;
    language?: string | null;
    error?: string;
  };
  try {
    parsed = JSON.parse(rawOutput) as typeof parsed;
  } catch (error) {
    throw new Error(
      `Transcription process returned invalid JSON output. ${(error as Error).message}`,
    );
  }

  if (!parsed.success || !parsed.text) {
    throw new Error(parsed.error ?? "Transcription failed.");
  }

  const transcriptPath = toTranscriptPath(audioPath);
  onEvent?.({
    step: "writing_output",
    message: "Saving transcript file.",
    progressBar: buildProgressBar(100),
    percent: 100,
    isIndeterminate: false,
    stageLabel: "Saving transcript",
  });
  await writeFile(transcriptPath, parsed.text, "utf8");
  await writeFile(modelMarkerPath, "ready\n", "utf8");

  onEvent?.({
    step: "complete",
    message: "Transcription complete.",
    progressBar: buildProgressBar(100),
    percent: 100,
    isIndeterminate: false,
    stageLabel: "Completed",
  });

  return {
    text: parsed.text,
    language: parsed.language ?? null,
    transcriptPath,
  } satisfies TranscriptionResult;
}

const TRANSCRIPTION_RUNTIME_DIR = join(DATABASE_DIRECTORY_PATH, "python-venv");
const TRANSCRIPTION_MODELS_DIRECTORY = join(DATABASE_DIRECTORY_PATH, "transcription-models");
const TRANSCRIPTION_RUNTIME_MARKER_PATH = join(TRANSCRIPTION_RUNTIME_DIR, ".runtime-ready");
const VENV_PYTHON_PATH =
  process.platform === "win32"
    ? join(TRANSCRIPTION_RUNTIME_DIR, "Scripts", "python.exe")
    : join(TRANSCRIPTION_RUNTIME_DIR, "bin", "python");
const DEFAULT_MODEL = TRANSCRIPTION_CONFIG.defaultModel;

function resolvePythonCommand() {
  const commands = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
  for (const command of commands) {
    const version = spawnSync(command, ["--version"], {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });
    if (version.status === 0) {
      return command;
    }
  }
  return null;
}

async function pathExists(path: string) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function runCommand(input: {
  command: string;
  args: string[];
  onLine?: (line: string) => void;
  onHeartbeat?: (elapsedMs: number) => void;
  heartbeatMs?: number;
}) {
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(input.command, input.args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let stderrAll = "";
    const startedAt = Date.now();
    const heartbeatTimer =
      input.onHeartbeat && input.heartbeatMs
        ? setInterval(() => {
            input.onHeartbeat?.(Date.now() - startedAt);
          }, input.heartbeatMs)
        : null;

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split(/\r?\n|\r/);
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }
        input.onLine?.(line);
      }
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderrAll += chunk;
      stderrBuffer += chunk;
      const lines = stderrBuffer.split(/\r?\n|\r/);
      stderrBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }
        input.onLine?.(line);
      }
    });

    child.once("error", (error) => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      reject(error);
    });

    child.once("close", (code) => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      if (stdoutBuffer.trim()) {
        input.onLine?.(stdoutBuffer.trim());
      }
      if (stderrBuffer.trim()) {
        input.onLine?.(stderrBuffer.trim());
      }
      if (code !== 0) {
        reject(
          new Error(
            `Command failed: ${input.command} ${input.args.join(" ")}\n${stderrAll.trim()}`,
          ),
        );
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function getModelReadyMarkerPath(model: string) {
  return join(TRANSCRIPTION_MODELS_DIRECTORY, `${sanitizeFileName(model)}.ready`);
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "_");
}

function extractPercentFromLine(line: string) {
  const match = line.match(/(\d{1,3})%/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  if (Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, value));
}

function buildProgressBar(percent: number | null) {
  const width = 20;
  if (percent === null) {
    return `[${"#".repeat(1)}${"-".repeat(width - 1)}]`;
  }
  const filled = Math.round((percent / 100) * width);
  return `[${"#".repeat(filled)}${"-".repeat(Math.max(0, width - filled))}]`;
}

function parseHelperProgressLine(line: string): {
  step: TranscriptionProgressStep;
  message: string;
  percent: number | null;
} | null {
  if (!line.startsWith("SPEEKR_PROGRESS|")) {
    return null;
  }

  const [, stepRaw, percentRaw, ...messageParts] = line.split("|");
  const message = messageParts.join("|").trim() || "Working...";
  const mappedStep = mapProgressStep(stepRaw);
  const parsedPercent = Number(percentRaw);

  return {
    step: mappedStep,
    message,
    percent:
      Number.isFinite(parsedPercent) && parsedPercent >= 0
        ? Math.min(100, parsedPercent)
        : null,
  };
}

function mapProgressStep(stepRaw: string | undefined): TranscriptionProgressStep {
  switch (stepRaw) {
    case "loading_model":
      return "loading_model";
    case "transcribing":
      return "transcribing";
    case "writing_output":
      return "writing_output";
    case "complete":
      return "complete";
    default:
      return "starting";
  }
}

function getTranscriptionStageLabel(step: TranscriptionProgressStep) {
  switch (step) {
    case "starting":
      return "Preparing process";
    case "loading_model":
      return "Loading model";
    case "transcribing":
      return "Transcribing audio";
    case "writing_output":
      return "Saving transcript";
    case "complete":
      return "Completed";
    default:
      return "Working";
  }
}

function toTranscriptPath(audioPath: string) {
  return audioPath.replace(/\.[^/.]+$/, ".txt");
}
