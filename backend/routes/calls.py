"""Calls listing, detail, logs, and secure audio download."""

import mimetypes
from pathlib import Path
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from config import settings
from models.schemas import CallListItem, CallStatus, ReviewStatus, SentimentType
from services import mongo_service

router = APIRouter(prefix="/calls", tags=["calls"])


class ReviewStatusUpdateRequest(BaseModel):
    """Request body for updating call review status."""

    review_status: ReviewStatus


def _serialize_call(doc: dict[str, Any]) -> dict[str, Any]:
    """Convert Mongo `_id` to string `id` for JSON responses."""
    try:
        d = dict(doc)
        oid = d.pop("_id", None)
        if oid is not None:
            d["id"] = str(oid)
        return d
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("")
async def list_calls() -> list[dict[str, Any]]:
    """
    List all calls with summary fields, newest processed first.
    """
    try:
        rows = await mongo_service.get_all_calls()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    out: list[dict[str, Any]] = []
    for doc in rows:
        try:
            oid = doc.get("_id")
            st = doc.get("status")
            try:
                status_enum = CallStatus(str(st)) if st else CallStatus.pending
            except Exception:
                status_enum = CallStatus.pending
            sent = doc.get("sentiment")
            try:
                sentiment_val = SentimentType(str(sent)) if sent else None
            except Exception:
                sentiment_val = None
            rev = doc.get("review_status")
            try:
                review_status_val = (
                    ReviewStatus(str(rev)) if rev else ReviewStatus.pending
                )
            except Exception:
                review_status_val = ReviewStatus.pending
            item = CallListItem(
                id=str(oid) if oid is not None else "",
                file_name=str(doc.get("file_name") or ""),
                agent_name=str(doc.get("agent_name") or "Not Found"),
                customer_name=str(doc.get("customer_name") or "Not Found"),
                duration_seconds=doc.get("duration_seconds"),
                overall_score=doc.get("overall_score"),
                sentiment=sentiment_val,
                review_status=review_status_val,
                status=status_enum,
                processed_at=doc.get("processed_at"),
            )
            out.append(item.model_dump())
        except Exception:
            continue
    return out


@router.get("/{call_id}")
async def get_call(call_id: str) -> dict[str, Any]:
    """Return the full call document for a MongoDB ObjectId."""
    try:
        ObjectId(call_id)
    except (InvalidId, TypeError) as e:
        raise HTTPException(status_code=400, detail="Invalid call id") from e

    try:
        doc = await mongo_service.get_call_by_id(call_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    if not doc:
        raise HTTPException(status_code=404, detail="Call not found")
    return _serialize_call(doc)


@router.get("/{call_id}/logs")
async def get_call_logs(call_id: str) -> list[dict[str, Any]]:
    """Return pipeline logs for this call, oldest first."""
    try:
        ObjectId(call_id)
    except (InvalidId, TypeError) as e:
        raise HTTPException(status_code=400, detail="Invalid call id") from e

    try:
        logs = await mongo_service.get_logs_by_call_id(call_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    result: list[dict[str, Any]] = []
    for row in logs:
        try:
            r = dict(row)
            oid = r.pop("_id", None)
            if oid is not None:
                r["id"] = str(oid)
            result.append(r)
        except Exception:
            continue
    return result


@router.get("/{call_id}/audio")
async def get_call_audio(call_id: str) -> FileResponse:
    """
    Stream the original recording file after verifying it lives under RECORDINGS_PATH.
    """
    try:
        ObjectId(call_id)
    except (InvalidId, TypeError) as e:
        raise HTTPException(status_code=400, detail="Invalid call id") from e

    try:
        doc = await mongo_service.get_call_by_id(call_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    if not doc:
        raise HTTPException(status_code=404, detail="Call not found")

    raw_path = str(doc.get("file_path") or "").strip()
    if not raw_path:
        raise HTTPException(status_code=404, detail="No audio path on record")

    try:
        rec_root = settings.recordings_path_resolved
        resolved_audio = Path(raw_path).resolve()
        resolved_root = rec_root.resolve()
        try:
            resolved_audio.relative_to(resolved_root)
        except ValueError as e:
            raise HTTPException(status_code=403, detail="Access denied") from e
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    if not resolved_audio.is_file():
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    mime, _ = mimetypes.guess_type(str(resolved_audio))
    media = mime or "application/octet-stream"

    try:
        return FileResponse(
            path=str(resolved_audio),
            media_type=media,
            filename=resolved_audio.name,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.patch("/{call_id}/review")
async def update_call_review_status(
    call_id: str,
    payload: ReviewStatusUpdateRequest,
) -> dict[str, Any]:
    """Update review status for a call."""
    try:
        ObjectId(call_id)
    except (InvalidId, TypeError) as e:
        raise HTTPException(status_code=400, detail="Invalid call id") from e

    try:
        updated = await mongo_service.update_review_status(
            call_id=call_id,
            review_status=payload.review_status.value,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    if not updated:
        raise HTTPException(status_code=404, detail="Call not found")

    return {
        "success": True,
        "review_status": payload.review_status.value,
    }
