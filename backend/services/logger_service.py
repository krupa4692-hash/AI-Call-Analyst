"""Structured pipeline logging to MongoDB and stdout."""

from datetime import datetime, timezone
from typing import Any, Optional

from models.schemas import StageStatus
from services import mongo_service


async def log_stage(
    call_id: str,
    file_name: str,
    stage: str,
    status: StageStatus,
    message: str,
    error: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> None:
    """
    Persist a log entry and echo a single line to the console.
    Swallows all exceptions so logging never breaks the pipeline.
    """
    try:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        line = f"[{ts}] [{stage}] [{status.value}] {file_name}: {message}"
        print(line, flush=True)
    except Exception:
        pass
    try:
        await mongo_service.insert_log(
            call_id=call_id,
            file_name=file_name,
            stage=stage,
            status=status,
            message=message,
            error=error,
            metadata=metadata,
        )
    except Exception:
        pass
