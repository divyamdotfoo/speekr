#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path

from faster_whisper import WhisperModel


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--model", default="base")
    parser.add_argument("--language", default=None)
    parser.add_argument("--first-run", action="store_true")
    args = parser.parse_args()

    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(json.dumps({"success": False, "error": f"Audio file not found: {audio_path}"}))
        return 1

    try:
        if args.first_run:
            emit_progress(
                "loading_model",
                5,
                f"Loading model: {args.model}. First run can take longer while model files download.",
            )
        else:
            emit_progress("loading_model", 5, f"Loading model: {args.model}")

        model = WhisperModel(args.model, device="cpu", compute_type="int8")
        emit_progress("loading_model", 10, "Model loaded. Preparing transcription pipeline.")
        emit_progress("transcribing", 15, "Model ready. Starting transcription.")

        segments_iter, info = model.transcribe(
            str(audio_path),
            language=args.language or None,
            vad_filter=True,
        )

        segments = []
        duration = float(info.duration or 0.0)
        for segment in segments_iter:
            segments.append(
                {
                    "start": float(segment.start),
                    "end": float(segment.end),
                    "text": segment.text.strip(),
                }
            )
            if duration > 0:
                percent = int(min(95, max(15, (segment.end / duration) * 90)))
                emit_progress("transcribing", percent, "Transcribing audio.")

        text = " ".join(segment["text"] for segment in segments).strip()
        emit_progress("complete", 100, "Transcription complete.")

        print(
            json.dumps(
                {
                    "success": True,
                    "text": text,
                    "language": getattr(info, "language", None),
                    "duration": duration,
                    "segments": segments,
                }
            )
        )
        return 0
    except Exception as error:  # pragma: no cover
        print(json.dumps({"success": False, "error": str(error)}))
        return 1


def emit_progress(step: str, percent: int, message: str) -> None:
    print(f"SPEEKR_PROGRESS|{step}|{percent}|{message}", file=sys.stderr, flush=True)


if __name__ == "__main__":
    raise SystemExit(main())
