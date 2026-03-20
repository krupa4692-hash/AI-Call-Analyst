"""Manual queue processing trigger and queue status inspection."""

import asyncio
from typing import Any

from fastapi import APIRouter, HTTPException

from services import mongo_service, queue_service

router = APIRouter(prefix="/queue", tags=["queue"])


def _serialize_queue(doc: dict[str, Any]) -> dict[str, Any]:
    """Normalize Mongo `_id` to `id` for JSON output."""
    try:
        d = dict(doc)
        oid = d.pop("_id", None)
        if oid is not None:
            d["id"] = str(oid)
        return d
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/process")
async def trigger_queue_processing() -> dict[str, str]:
    """
    Kick off a one-shot folder scan and sequential queue drain in the background.
    """
    try:
        asyncio.create_task(queue_service.run_scan_and_process_once())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return {"message": "Queue processing started"}


@router.get("/status")
async def queue_status() -> list[dict[str, Any]]:
    """Return every row in processing_queue with current status."""
    try:
        items = await mongo_service.get_all_queue_items()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    out: list[dict[str, Any]] = []
    for it in items:
        try:
            out.append(_serialize_queue(it))
        except Exception:
            continue
    return out
