"""OpenAI Whisper transcription with validation and structured logging."""

import io
import os
from pathlib import Path
from typing import Any, Optional

import aiofiles
from mutagen import File as MutagenFile
from openai import APIError, AsyncOpenAI, OpenAIError

from config import settings
from models.schemas import StageStatus
from services import logger_service

MAX_BYTES = 25 * 1024 * 1024


async def transcribe_audio(file_path: str, call_id: str) -> dict[str, Any]:
    """
    Transcribe an audio file with Whisper (verbose_json).
    Validates existence and size (<25MB). Logs start/complete/fail stages.
    Returns {"transcript": str, "duration_seconds": float}.
    """
    file_name = Path(file_path).name
    try:
        p = Path(file_path)
        if not p.is_file():
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        size = os.path.getsize(file_path)
        if size > MAX_BYTES:
            raise ValueError(
                f"Audio file exceeds 25MB limit ({size} bytes): {file_path}"
            )
        if size == 0:
            raise ValueError(f"Audio file is empty: {file_path}")
    except Exception as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="transcription_failed",
                status=StageStatus.failed,
                message="Validation failed before transcription",
                error=str(e),
            )
        except Exception:
            pass
        raise

    try:
        await logger_service.log_stage(
            call_id=call_id,
            file_name=file_name,
            stage="transcription_started",
            status=StageStatus.started,
            message="OpenAI Whisper transcription started",
            metadata={"whisper_model": "whisper-1"},
        )
    except Exception:
        pass

    client: Optional[AsyncOpenAI] = None
    try:
        client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            timeout=600.0,
        )
    except Exception as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="transcription_failed",
                status=StageStatus.failed,
                message="Failed to create OpenAI client",
                error=str(e),
            )
        except Exception:
            pass
        raise

    try:
        async with aiofiles.open(file_path, "rb") as audio_f:
            audio_bytes = await audio_f.read()
        buffer = io.BytesIO(audio_bytes)
        buffer.name = file_name or "audio.mp3"
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=buffer,
            response_format="verbose_json",
        )
    except APIError as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="transcription_failed",
                status=StageStatus.failed,
                message="OpenAI API error during transcription",
                error=str(e),
            )
        except Exception:
            pass
        raise
    except OpenAIError as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="transcription_failed",
                status=StageStatus.failed,
                message="OpenAI error during transcription",
                error=str(e),
            )
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="transcription_failed",
                status=StageStatus.failed,
                message="Unexpected error during transcription",
                error=str(e),
            )
        except Exception:
            pass
        raise

    try:
        text = getattr(response, "text", None) or ""
        duration_sec = float(getattr(response, "duration", 0.0) or 0.0)
        if duration_sec <= 0:
            try:
                meta = MutagenFile(file_path)
                if meta is not None and getattr(meta, "info", None) is not None:
                    duration_sec = float(
                        getattr(meta.info, "length", 0.0) or 0.0
                    )
            except Exception:
                pass
        if not text.strip():
            raise ValueError("Whisper returned an empty transcript")
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="transcription_completed",
                status=StageStatus.success,
                message="Transcription completed",
                metadata={
                    "whisper_model": "whisper-1",
                    "duration_ms": duration_sec * 1000.0,
                },
            )
        except Exception:
            pass
        return {"transcript": text.strip(), "duration_seconds": duration_sec}
    except Exception as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="transcription_failed",
                status=StageStatus.failed,
                message="Failed to parse Whisper response",
                error=str(e),
            )
        except Exception:
            pass
        raise
