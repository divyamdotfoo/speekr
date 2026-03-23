import { spawn, spawnSync } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findUpSync } from "find-up";
import { DATABASE_DIRECTORY_PATH } from "../../db/client.ts";
import { TRANSCRIPTION_DEFAULT_MODEL } from "../../constants/index.ts";
import type {
  LoadingProgressEvent,
  TranscriptionResult,
} from "../../types/index.ts";

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
  onEvent?: (event: LoadingProgressEvent) => void;
  onLog?: (line: string) => void;
}) {
  const onEvent = input?.onEvent;
  const onLog = input?.onLog;
  onEvent?.({
    step: "checking",
    message: "Checking Python runtime and virtual environment.",
    percent: null,
    isIndeterminate: true,
    stageLabel: "Checking runtime",
    hint: "We install local dependencies only once so transcription works fully offline.",
  });

  const pythonCommand = resolvePythonCommand();
  if (!pythonCommand) {
    throw new Error(
      "Python 3 was not found. Install Python 3.9+ and run `speekr setup` again."
    );
  }

  await mkdir(TRANSCRIPTION_RUNTIME_DIR, { recursive: true });

  const hasVirtualEnvironment = await pathExists(VENV_PYTHON_PATH);
  const hasRuntimeMarker = await pathExists(TRANSCRIPTION_RUNTIME_MARKER_PATH);
  if (!hasVirtualEnvironment) {
    onEvent?.({
      step: "creating_venv",
      message: "Creating isolated Python environment.",
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
          percent,
          isIndeterminate: percent === null,
          stageLabel: "Creating virtual environment",
        });
      },
      onHeartbeat: () => {
        onEvent?.({
          step: "creating_venv",
          message: "Creating isolated Python environment.",
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
      percent: null,
      isIndeterminate: true,
      stageLabel: "Upgrading pip",
    });
    await runCommand({
      command: VENV_PYTHON_PATH,
      args: [
        "-m",
        "pip",
        "install",
        "--upgrade",
        "pip",
        "--progress-bar",
        "on",
      ],
      heartbeatMs: 1200,
      onLine(line) {
        onLog?.(line);
        const percent = extractPercentFromLine(line);
        onEvent?.({
          step: "upgrading_pip",
          message: "Upgrading pip in the virtual environment.",
          percent,
          isIndeterminate: percent === null,
          stageLabel: "Upgrading pip",
        });
      },
      onHeartbeat: () => {
        onEvent?.({
          step: "upgrading_pip",
          message: "Upgrading pip in the virtual environment.",
          percent: null,
          isIndeterminate: true,
          stageLabel: "Upgrading pip",
        });
      },
    });

    onEvent?.({
      step: "installing_packages",
      message: "Installing speech transcription dependencies.",
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
          percent,
          isIndeterminate: percent === null,
          stageLabel: "Installing dependencies",
        });
      },
      onHeartbeat: () => {
        onEvent?.({
          step: "installing_packages",
          message: "Installing speech transcription dependencies.",
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
    percent: 100,
    isIndeterminate: false,
    stageLabel: "Completed",
  });
}

export async function transcribeRecordingLocally(input: {
  audioPath: string;
  model?: string;
  languageCode?: string;
  onEvent?: (event: LoadingProgressEvent) => void;
  onLog?: (line: string) => void;
}) {
  const {
    audioPath,
    model = DEFAULT_MODEL,
    languageCode,
    onEvent,
    onLog,
  } = input;
  onEvent?.({
    step: "starting",
    message: "Preparing transcription process.",
    percent: null,
    isIndeterminate: true,
    stageLabel: "Preparing process",
  });

  const helperScript = getTranscriptionHelperScriptPath();
  if (!(await pathExists(helperScript))) {
    throw new Error(
      "Transcription helper script is missing from the package assets."
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
  let activeProgressStep: LocalTranscriptionStep = "loading_model";
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
        percent: progress.percent,
        isIndeterminate:
          progress.percent === null || progress.step === "loading_model",
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
      `Transcription process returned invalid JSON output. ${
        (error as Error).message
      }`
    );
  }

  if (!parsed.success || !parsed.text) {
    throw new Error(parsed.error ?? "Transcription failed.");
  }

  onEvent?.({
    step: "writing_output",
    message: "Finalizing transcription result.",
    percent: 100,
    isIndeterminate: false,
    stageLabel: "Finalizing",
  });
  await writeFile(modelMarkerPath, "ready\n", "utf8");

  onEvent?.({
    step: "complete",
    message: "Transcription complete.",
    percent: 100,
    isIndeterminate: false,
    stageLabel: "Completed",
  });

  return {
    text: parsed.text,
    language: parsed.language ?? null,
  } satisfies TranscriptionResult;
}

const TRANSCRIPTION_RUNTIME_DIR = join(DATABASE_DIRECTORY_PATH, "python-venv");
const TRANSCRIPTION_MODELS_DIRECTORY = join(
  DATABASE_DIRECTORY_PATH,
  "transcription-models"
);
const TRANSCRIPTION_RUNTIME_MARKER_PATH = join(
  TRANSCRIPTION_RUNTIME_DIR,
  ".runtime-ready"
);
const VENV_PYTHON_PATH =
  process.platform === "win32"
    ? join(TRANSCRIPTION_RUNTIME_DIR, "Scripts", "python.exe")
    : join(TRANSCRIPTION_RUNTIME_DIR, "bin", "python");
const DEFAULT_MODEL = TRANSCRIPTION_DEFAULT_MODEL;

function resolvePythonCommand() {
  const commands =
    process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
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
            `Command failed: ${input.command} ${input.args.join(
              " "
            )}\n${stderrAll.trim()}`
          )
        );
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function getModelReadyMarkerPath(model: string) {
  return join(
    TRANSCRIPTION_MODELS_DIRECTORY,
    `${sanitizeFileName(model)}.ready`
  );
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

function parseHelperProgressLine(line: string): {
  step: LocalTranscriptionStep;
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

function mapProgressStep(
  stepRaw: string | undefined
): LocalTranscriptionStep {
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

function getTranscriptionStageLabel(step: LocalTranscriptionStep) {
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

type LocalTranscriptionStep =
  | "starting"
  | "loading_model"
  | "transcribing"
  | "writing_output"
  | "complete";

