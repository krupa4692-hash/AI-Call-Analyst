"""Async MongoDB access via Motor: connection, indexes, and CRUD helpers."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError

from config import settings
from models.schemas import CallStatus, StageStatus

# Singleton client and db reference (initialized in connect())
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None

DASHBOARD_DOC_ID = "dashboard_singleton"


async def connect() -> None:
    """Create the Motor client and verify connectivity."""
    global _client, _db
    try:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
        _db = _client[settings.db_name]
        await _client.admin.command("ping")
    except Exception:
        _client = None
        _db = None
        raise


async def close() -> None:
    """Close the Motor client."""
    global _client, _db
    try:
        if _client is not None:
            _client.close()
    finally:
        _client = None
        _db = None


def get_db() -> AsyncIOMotorDatabase:
    """Return the active database handle."""
    if _db is None:
        raise RuntimeError("MongoDB is not connected. Call connect() first.")
    return _db


async def create_indexes() -> None:
    """Create required indexes for all collections."""
    db = get_db()
    try:
        await db["processing_queue"].create_index(
            [("file_path", ASCENDING)], unique=True, name="uniq_file_path_queue"
        )
    except Exception:
        pass
    try:
        await db["calls"].create_index(
            [("file_path", ASCENDING)], unique=True, name="uniq_file_path_calls"
        )
    except Exception:
        pass
    try:
        await db["call_logs"].create_index(
            [("call_id", ASCENDING)], name="idx_call_id"
        )
    except Exception:
        pass
    try:
        await db["questionnaire"].create_index(
            [("question_id", ASCENDING)], unique=True, name="uniq_question_id"
        )
    except Exception:
        pass


# --- calls ---


async def insert_call(
    file_name: str,
    file_path: str,
    status: CallStatus = CallStatus.pending,
) -> str:
    """Insert a new call document; returns inserted id as string."""
    db = get_db()
    doc: dict[str, Any] = {
        "file_name": file_name,
        "file_path": file_path,
        "agent_name": "Not Found",
        "customer_name": "Not Found",
        "status": status.value,
        "keywords": [],
        "action_items": [],
        "questionnaire_coverage": [],
        "positive_observations": [],
        "negative_observations": [],
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = await db["calls"].insert_one(doc)
        return str(result.inserted_id)
    except DuplicateKeyError:
        existing = await db["calls"].find_one({"file_path": file_path})
        if existing and "_id" in existing:
            return str(existing["_id"])
        raise


async def get_call_by_id(call_id: str) -> Optional[dict[str, Any]]:
    """Fetch a call by MongoDB ObjectId string."""
    db = get_db()
    try:
        oid = ObjectId(call_id)
    except Exception:
        return None
    try:
        return await db["calls"].find_one({"_id": oid})
    except Exception:
        return None


async def get_call_by_file_path(file_path: str) -> Optional[dict[str, Any]]:
    """Fetch a call document by normalized file path."""
    db = get_db()
    try:
        return await db["calls"].find_one({"file_path": file_path})
    except Exception:
        return None


async def get_all_calls() -> list[dict[str, Any]]:
    """Return all calls sorted by processed_at descending."""
    db = get_db()
    try:
        cursor = db["calls"].find({}).sort(
            [("processed_at", DESCENDING), ("_id", DESCENDING)]
        )
        return await cursor.to_list(length=None)
    except Exception:
        return []


async def update_call_status(
    call_id: str,
    status: CallStatus,
    extra: Optional[dict[str, Any]] = None,
) -> bool:
    """Update call status and optional extra fields."""
    db = get_db()
    try:
        oid = ObjectId(call_id)
    except Exception:
        return False
    payload: dict[str, Any] = {"status": status.value}
    if extra:
        payload.update(extra)
    try:
        result = await db["calls"].update_one({"_id": oid}, {"$set": payload})
        return result.matched_count > 0
    except Exception:
        return False


async def update_review_status(
    call_id: str,
    review_status: str,
) -> bool:
    """Update the call review_status by call id."""
    db = get_db()
    try:
        oid = ObjectId(call_id)
    except Exception:
        return False
    try:
        result = await db["calls"].update_one(
            {"_id": oid},
            {"$set": {"review_status": review_status}},
        )
        return result.matched_count > 0
    except Exception:
        return False


async def update_call_transcript(
    call_id: str,
    transcript: str,
    duration_seconds: float,
) -> bool:
    """Persist transcript and duration after Whisper."""
    db = get_db()
    try:
        oid = ObjectId(call_id)
    except Exception:
        return False
    try:
        result = await db["calls"].update_one(
            {"_id": oid},
            {
                "$set": {
                    "transcript": transcript,
                    "duration_seconds": duration_seconds,
                }
            },
        )
        return result.matched_count > 0
    except Exception:
        return False


async def update_call_analysis(
    call_id: str,
    agent_name: str,
    customer_name: str,
    summary: str,
    sentiment: str,
    overall_score: float,
    talk_time: dict[str, Any],
    agent_scores: dict[str, Any],
    keywords: list[str],
    action_items: list[str],
    questionnaire_coverage: list[dict[str, Any]],
    positive_observations: list[dict[str, Any]],
    negative_observations: list[dict[str, Any]],
    status: CallStatus = CallStatus.completed,
) -> bool:
    """Write GPT analysis fields and final status."""
    db = get_db()
    try:
        oid = ObjectId(call_id)
    except Exception:
        return False
    try:
        result = await db["calls"].update_one(
            {"_id": oid},
            {
                "$set": {
                    "agent_name": agent_name,
                    "customer_name": customer_name,
                    "summary": summary,
                    "sentiment": sentiment,
                    "overall_score": overall_score,
                    "talk_time": talk_time,
                    "agent_scores": agent_scores,
                    "keywords": keywords,
                    "action_items": action_items,
                    "questionnaire_coverage": questionnaire_coverage,
                    "positive_observations": positive_observations,
                    "negative_observations": negative_observations,
                    "status": status.value,
                }
            },
        )
        return result.matched_count > 0
    except Exception:
        return False


async def set_call_processed_at_now(call_id: str) -> bool:
    """Set processed_at to current UTC time."""
    db = get_db()
    try:
        oid = ObjectId(call_id)
    except Exception:
        return False
    try:
        result = await db["calls"].update_one(
            {"_id": oid},
            {"$set": {"processed_at": datetime.now(timezone.utc)}},
        )
        return result.matched_count > 0
    except Exception:
        return False


# --- dashboard_stats ---


async def get_stats() -> Optional[dict[str, Any]]:
    """Return the singleton dashboard stats document."""
    db = get_db()
    try:
        return await db["dashboard_stats"].find_one({"_id": DASHBOARD_DOC_ID})
    except Exception:
        return None


async def upsert_stats(stats: dict[str, Any]) -> None:
    """Upsert aggregated dashboard metrics."""
    db = get_db()
    doc = dict(stats)
    doc["_id"] = DASHBOARD_DOC_ID
    doc["last_updated"] = datetime.now(timezone.utc)
    try:
        await db["dashboard_stats"].replace_one(
            {"_id": DASHBOARD_DOC_ID}, doc, upsert=True
        )
    except Exception:
        raise


async def recalculate_dashboard_stats() -> dict[str, Any]:
    """
    Recompute dashboard metrics from completed calls using aggregation:
    counts, averages, sentiment breakdown, top keywords, action item totals.
    """
    db = get_db()
    pipeline: list[dict[str, Any]] = [
        {"$match": {"status": CallStatus.completed.value}},
        {
            "$facet": {
                "totals": [
                    {
                        "$group": {
                            "_id": None,
                            "total_calls": {"$sum": 1},
                            "avg_call_score": {"$avg": "$overall_score"},
                            "avg_duration_seconds": {"$avg": "$duration_seconds"},
                        }
                    }
                ],
                "sentiment": [
                    {"$group": {"_id": "$sentiment", "c": {"$sum": 1}}},
                ],
                "keywords_flat": [
                    {"$project": {"kw": {"$ifNull": ["$keywords", []]}}},
                    {"$unwind": {"path": "$kw", "preserveNullAndEmptyArrays": True}},
                    {"$match": {"kw": {"$ne": None}}},
                    {"$group": {"_id": "$kw", "n": {"$sum": 1}}},
                    {"$sort": {"n": -1}},
                    {"$limit": 10},
                ],
                "action_len": [
                    {
                        "$project": {
                            "n": {
                                "$cond": [
                                    {"$isArray": "$action_items"},
                                    {"$size": "$action_items"},
                                    0,
                                ]
                            }
                        }
                    },
                    {"$group": {"_id": None, "total_action_items": {"$sum": "$n"}}},
                ],
            }
        },
    ]
    try:
        agg = await db["calls"].aggregate(pipeline).to_list(length=1)
    except Exception:
        return {
            "total_calls": 0,
            "avg_call_score": None,
            "avg_duration_seconds": None,
            "sentiment_split": {},
            "top_keywords": [],
            "total_action_items": 0,
        }
    if not agg:
        return {
            "total_calls": 0,
            "avg_call_score": None,
            "avg_duration_seconds": None,
            "sentiment_split": {},
            "top_keywords": [],
            "total_action_items": 0,
        }
    data = agg[0]
    totals_block = data.get("totals") or []
    totals = totals_block[0] if totals_block else {}
    sentiment_rows = data.get("sentiment") or []
    sentiment_split: dict[str, int] = {}
    for row in sentiment_rows:
        key = row.get("_id")
        if key is not None:
            sentiment_split[str(key)] = int(row.get("c", 0))
    kw_rows = data.get("keywords_flat") or []
    top_keywords: list[dict[str, Any]] = []
    for row in kw_rows:
        k = row.get("_id")
        if k:
            top_keywords.append({"keyword": k, "count": int(row.get("n", 0))})
    action_block = (data.get("action_len") or [{}])[0]
    total_action_items = int(action_block.get("total_action_items", 0))
    return {
        "total_calls": int(totals.get("total_calls", 0)),
        "avg_call_score": totals.get("avg_call_score"),
        "avg_duration_seconds": totals.get("avg_duration_seconds"),
        "sentiment_split": sentiment_split,
        "top_keywords": top_keywords,
        "total_action_items": total_action_items,
    }


# --- questionnaire ---


async def get_all_questions() -> list[dict[str, Any]]:
    """Return all questionnaire documents sorted by question_id."""
    db = get_db()
    try:
        cursor = db["questionnaire"].find({}).sort("question_id", ASCENDING)
        return await cursor.to_list(length=None)
    except Exception:
        return []


async def seed_questions() -> int:
    """
    Load `questionnaire_seed.json` and insert each row if the collection is empty.
    Returns number of documents inserted.
    """
    db = get_db()
    try:
        count = await db["questionnaire"].count_documents({})
    except Exception:
        count = 0
    if count > 0:
        return 0
    seed_path = Path(__file__).resolve().parent.parent / "questionnaire_seed.json"
    try:
        raw = seed_path.read_text(encoding="utf-8")
        items = json.loads(raw)
    except Exception:
        return 0
    if not isinstance(items, list):
        return 0
    inserted = 0
    now = datetime.now(timezone.utc)
    for row in items:
        try:
            qid = row.get("question_id")
            if not qid:
                continue
            doc = {
                "question_id": qid,
                "question": row.get("question", ""),
                "category": row.get("category", ""),
                "is_active": bool(row.get("is_active", True)),
                "created_at": now,
            }
            await db["questionnaire"].insert_one(doc)
            inserted += 1
        except DuplicateKeyError:
            continue
        except Exception:
            continue
    return inserted


# --- call_logs ---


async def insert_log(
    call_id: str,
    file_name: str,
    stage: str,
    status: StageStatus,
    message: str,
    error: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> Optional[str]:
    """Append a pipeline log entry."""
    db = get_db()
    doc: dict[str, Any] = {
        "call_id": call_id,
        "file_name": file_name,
        "stage": stage,
        "status": status.value,
        "message": message,
        "error": error,
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = await db["call_logs"].insert_one(doc)
        return str(result.inserted_id)
    except Exception:
        return None


async def get_logs_by_call_id(call_id: str) -> list[dict[str, Any]]:
    """Return logs for a call sorted by created_at ascending."""
    db = get_db()
    try:
        cursor = db["call_logs"].find({"call_id": call_id}).sort(
            "created_at", ASCENDING
        )
        return await cursor.to_list(length=None)
    except Exception:
        return []


# --- processing_queue ---


async def insert_queue_item(
    file_name: str,
    file_path: str,
    priority: int = 0,
    max_attempts: int = 3,
) -> str:
    """Insert a queue row; returns id string."""
    db = get_db()
    now = datetime.now(timezone.utc)
    doc: dict[str, Any] = {
        "file_name": file_name,
        "file_path": file_path,
        "priority": priority,
        "status": "queued",
        "attempts": 0,
        "max_attempts": max_attempts,
        "queued_at": now,
        "started_at": None,
        "completed_at": None,
    }
    try:
        result = await db["processing_queue"].insert_one(doc)
        return str(result.inserted_id)
    except DuplicateKeyError:
        existing = await db["processing_queue"].find_one({"file_path": file_path})
        if existing and "_id" in existing:
            return str(existing["_id"])
        raise


async def get_pending_items() -> list[dict[str, Any]]:
    """Items waiting to be processed, highest priority first."""
    db = get_db()
    try:
        cursor = (
            db["processing_queue"]
            .find({"status": "queued"})
            .sort([("priority", DESCENDING), ("queued_at", ASCENDING)])
        )
        return await cursor.to_list(length=None)
    except Exception:
        return []


async def get_queue_by_id(queue_id: str) -> Optional[dict[str, Any]]:
    """Fetch queue document by id."""
    db = get_db()
    try:
        oid = ObjectId(queue_id)
    except Exception:
        return None
    try:
        return await db["processing_queue"].find_one({"_id": oid})
    except Exception:
        return None


async def check_file_exists(file_path: str) -> bool:
    """True if a queue row exists for this file path."""
    db = get_db()
    try:
        doc = await db["processing_queue"].find_one({"file_path": file_path})
        return doc is not None
    except Exception:
        return False


async def get_queue_by_file_path(file_path: str) -> Optional[dict[str, Any]]:
    """Return queue document for a file path if present."""
    db = get_db()
    try:
        return await db["processing_queue"].find_one({"file_path": file_path})
    except Exception:
        return None


async def update_queue_status(
    queue_id: str,
    status: str,
    *,
    increment_attempts: bool = False,
    set_started: bool = False,
    set_completed: bool = False,
    clear_timestamps: bool = False,
) -> bool:
    """Update queue status and optional timestamps."""
    db = get_db()
    try:
        oid = ObjectId(queue_id)
    except Exception:
        return False
    now = datetime.now(timezone.utc)
    update: dict[str, Any] = {"$set": {"status": status}}
    if set_started:
        update["$set"]["started_at"] = now
    if set_completed:
        update["$set"]["completed_at"] = now
    if clear_timestamps:
        update["$set"]["started_at"] = None
        update["$set"]["completed_at"] = None
    if increment_attempts:
        update["$inc"] = {"attempts": 1}
    try:
        result = await db["processing_queue"].update_one({"_id": oid}, update)
        return result.matched_count > 0
    except Exception:
        return False


async def get_all_queue_items() -> list[dict[str, Any]]:
    """Return every queue row for status API."""
    db = get_db()
    try:
        cursor = db["processing_queue"].find({}).sort(
            [("queued_at", DESCENDING)]
        )
        return await cursor.to_list(length=None)
    except Exception:
        return []
