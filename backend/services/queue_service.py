"""Scan recordings directory, manage the processing queue, and run the worker loop."""

import asyncio
import os
from pathlib import Path

from pymongo.errors import DuplicateKeyError

from config import settings
from models.schemas import CallStatus, StageStatus
from processor import call_processor
from services import logger_service, mongo_service

AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg"}


async def scan_recordings_folder() -> None:
    """
    Walk RECORDINGS_PATH for audio files. For each file:
    - If not in processing_queue: ensure a `calls` row exists, insert queue as queued, log file_queued.
    - If queue row exists with status failed and attempts < max_attempts: reset to queued, log file_requeued_for_retry.
    """
    base = settings.recordings_path_resolved
    try:
        base.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

    paths: list[Path] = []
    try:
        for root, _, names in os.walk(str(base)):
            for n in names:
                p = (Path(root) / n).resolve()
                if p.suffix.lower() in AUDIO_EXTENSIONS and p.is_file():
                    paths.append(p)
    except Exception as e:
        try:
            await logger_service.log_stage(
                call_id="queue",
                file_name="scan",
                stage="scan_failed",
                status=StageStatus.failed,
                message="Failed to walk recordings directory",
                error=str(e),
            )
        except Exception:
            pass
        return

    for path in paths:
        file_path = str(path)
        file_name = path.name
        try:
            in_queue = await mongo_service.check_file_exists(file_path)
        except Exception:
            continue

        if not in_queue:
            call_doc = None
            try:
                call_doc = await mongo_service.get_call_by_file_path(file_path)
            except Exception:
                call_doc = None
            if not call_doc:
                try:
                    await mongo_service.insert_call(
                        file_name, file_path, CallStatus.pending
                    )
                except Exception:
                    try:
                        call_doc = await mongo_service.get_call_by_file_path(
                            file_path
                        )
                    except Exception:
                        call_doc = None
            try:
                call_doc = await mongo_service.get_call_by_file_path(file_path)
            except Exception:
                call_doc = None
            call_id_log = str(call_doc["_id"]) if call_doc and "_id" in call_doc else "unknown"

            try:
                await mongo_service.insert_queue_item(file_name, file_path)
            except DuplicateKeyError:
                continue
            except Exception:
                continue

            try:
                await logger_service.log_stage(
                    call_id=call_id_log,
                    file_name=file_name,
                    stage="file_queued",
                    status=StageStatus.success,
                    message="New recording queued for processing",
                )
            except Exception:
                pass
            continue

        try:
            q = await mongo_service.get_queue_by_file_path(file_path)
        except Exception:
            q = None
        if not q or "_id" not in q:
            continue

        status = str(q.get("status") or "")
        attempts = int(q.get("attempts", 0))
        max_attempts = int(q.get("max_attempts", 3))
        qid = str(q["_id"])

        if status == "failed" and attempts < max_attempts:
            try:
                await mongo_service.update_queue_status(
                    qid, "queued", clear_timestamps=True
                )
            except Exception:
                pass
            try:
                cd = await mongo_service.get_call_by_file_path(file_path)
                cid = str(cd["_id"]) if cd and "_id" in cd else "unknown"
            except Exception:
                cid = "unknown"
            try:
                await logger_service.log_stage(
                    call_id=cid,
                    file_name=file_name,
                    stage="file_requeued_for_retry",
                    status=StageStatus.started,
                    message="Failed item requeued for retry",
                )
            except Exception:
                pass


async def process_queue() -> None:
    """
    Process all queued items sequentially with a 2s pause between calls
    to reduce upstream API rate pressure.
    """
    try:
        items = await mongo_service.get_pending_items()
    except Exception:
        items = []

    for item in items:
        try:
            qid = str(item["_id"])
            fp = str(item.get("file_path") or "")
            fn = str(item.get("file_name") or "")
        except Exception:
            continue
        try:
            await call_processor.process_call(fn, fp, qid)
        except Exception:
            pass
        try:
            await asyncio.sleep(2.0)
        except Exception:
            pass


async def start_queue_worker() -> None:
    """
    Periodic worker: scan folder, drain queue, then sleep 30s before the next poll.
    """
    while True:
        try:
            await scan_recordings_folder()
        except Exception:
            pass
        try:
            await process_queue()
        except Exception:
            pass
        try:
            await asyncio.sleep(30.0)
        except Exception:
            pass


async def run_scan_and_process_once() -> None:
    """One-shot scan + process (used by manual API trigger)."""
    try:
        await scan_recordings_folder()
    except Exception:
        pass
    try:
        await process_queue()
    except Exception:
        pass
