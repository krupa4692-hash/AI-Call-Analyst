"""Dashboard statistics API."""

from typing import Any

from fastapi import APIRouter, HTTPException

from services import mongo_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _empty_stats() -> dict[str, Any]:
    """Default payload when no aggregation document exists yet."""
    return {
        "last_updated": None,
        "total_calls": 0,
        "avg_call_score": None,
        "avg_duration_seconds": None,
        "sentiment_split": {},
        "top_keywords": [],
        "total_action_items": 0,
    }


@router.get("/stats")
async def get_dashboard_stats() -> dict[str, Any]:
    """
    Return the singleton dashboard_stats document.
    If none exists yet, return empty defaults without error.
    """
    try:
        doc = await mongo_service.get_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    if not doc:
        return _empty_stats()

    try:
        out = dict(doc)
        out.pop("_id", None)
        if out.get("last_updated") is None:
            out["last_updated"] = None
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
