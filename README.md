# Speekr

Local-first CLI for practicing spoken language: capture sessions from the terminal, transcribe audio, and review structured feedback and progress in a companion dashboard. Data stays on your machine under `~/.speekr`.

## Features

- **Interactive terminal UI** — Guided flows for setup, recording, and configuration (Ink / React).
- **Speaking sessions** — Record audio with prompts; requires a TTY and **FFmpeg** on your `PATH`.
- **Transcription** — Choose **local** (Whisper via an isolated Python environment), **OpenAI**, or **Deepgram**; override per run with `--transcription`.
- **AI feedback** — Session analysis (rewrites, vocabulary, grammar patterns, summary) via **OpenAI**, **Anthropic**, or **Deepgram**; keys are stored in the local SQLite database after setup (with optional env fallbacks where supported).
- **Language tracks** — Multiple target languages and proficiency levels; broad language set is supported in setup.
- **Web dashboard** — Local Express server serves a built SPA for stats, sessions, vocabulary, grammar, topics, and related views; API routes expose aggregated data from the same database.
- **Reset** — `reset` removes the local database and recordings after confirmation.

## Requirements

| Requirement | Notes |
|-------------|--------|
| **Node.js** | v20 or newer (`engines` in `package.json`). |
| **FFmpeg** | Required for `record`; install via your OS package manager and ensure the binary is on `PATH`. |
| **Python 3.9+** | Required only if you use **local** transcription; Speekr creates a dedicated venv and installs dependencies on first use. |
| **API keys** | Needed for cloud transcription and/or AI feedback as configured in `speekr setup`. Optional env fallbacks where implemented: `DEEPGRAM_API_KEY`, `ANTHROPIC_API_KEY`. |

## Install

From npm (once published):

```bash
npm install -g speekr
```

From a clone (contributors / local install):

```bash
pnpm install
pnpm build
pnpm link --global   # or: node dist/index.js
```

## Usage

| Command | Description |
|---------|-------------|
| `speekr` | Launch the home screen when no subcommand is given. |
| `speekr setup` | Run guided setup (profile, languages, default AI provider, transcription mode, API keys). |
| `speekr record` | Start a new session; `-t, --transcription` accepts `local`, `openai`, or `deepgram` to override the configured mode. |
| `speekr dashboard` | Start the dashboard server (default port `4000`); `-p, --port` to change. Opens the URL in your default browser when possible. |
| `speekr reset` | Delete local database and recordings (interactive confirmation). |

Non-interactive environments: `setup` and `record` expect a TTY; run them from a normal terminal session.

## Development

```bash
pnpm install
pnpm typecheck    # optional CI-style check
pnpm build        # dashboard (Vite) + Node (tsc) → dist/
pnpm dev          # API server with dashboard dev proxy + Vite dev server
```

For local dashboard dev, the dev server can read `SPEEKR_DASHBOARD_PORT` (see `src/server/dev.ts`).

## Data and privacy

Configuration, sessions, and recordings live under **`~/.speekr`**. Cloud providers you enable receive only the audio and text required for transcription and feedback for those requests.

## License

MIT — see [LICENSE](./LICENSE).
