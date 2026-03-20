"""End-to-end async pipeline: Whisper → GPT → persistence → dashboard stats."""

from typing import Any, Optional

from models.schemas import CallStatus, StageStatus
from services import gpt_service, logger_service, mongo_service, whisper_service


class _StageFailure(Exception):
    """Raised after a stage has logged and updated call/queue state; do not double-handle."""


def _normalize_sentiment(raw: str) -> str:
    """Map model output to allowed sentiment strings."""
    try:
        s = (raw or "").strip().lower()
        if s in ("positive", "neutral", "negative"):
            return s
        return "neutral"
    except Exception:
        return "neutral"


async def process_call(file_name: str, file_path: str, queue_id: str) -> None:
    """
    Run the full analysis pipeline for one recording:
    mark processing, transcribe, analyze, save, refresh dashboard, complete queue.
    Stage failures update MongoDB and queue attempts, then stop the pipeline.
    """
    call_doc: Optional[dict[str, Any]] = None
    call_id: Optional[str] = None

    try:
        call_doc = await mongo_service.get_call_by_file_path(file_path)
        if not call_doc or "_id" not in call_doc:
            try:
                await logger_service.log_stage(
                    call_id="unknown",
                    file_name=file_name,
                    stage="processing_failed",
                    status=StageStatus.failed,
                    message="No call document found for file_path",
                    error=file_path,
                )
            except Exception:
                pass
            try:
                await mongo_service.update_queue_status(
                    queue_id,
                    "failed",
                    increment_attempts=True,
                )
            except Exception:
                pass
            return

        call_id = str(call_doc["_id"])
    except Exception as e:
        try:
            await logger_service.log_stage(
                call_id="unknown",
                file_name=file_name,
                stage="processing_failed",
                status=StageStatus.failed,
                message="Failed to resolve call document",
                error=str(e),
            )
        except Exception:
            pass
        try:
            await mongo_service.update_queue_status(
                queue_id, "failed", increment_attempts=True
            )
        except Exception:
            pass
        return

    try:
        # Stage 1: mark processing
        try:
            await mongo_service.update_call_status(call_id, CallStatus.processing)
        except Exception:
            pass
        try:
            await mongo_service.update_queue_status(
                queue_id, "processing", set_started=True
            )
        except Exception:
            pass
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="processing_started",
                status=StageStatus.started,
                message="Pipeline started",
            )
        except Exception:
            pass

        # Stage 2: transcription (Whisper logs transcription_* stages)
        try:
            t_result = await whisper_service.transcribe_audio(file_path, call_id)
        except Exception as e:
            try:
                await mongo_service.update_call_status(call_id, CallStatus.failed)
            except Exception:
                pass
            try:
                await mongo_service.update_queue_status(
                    queue_id, "failed", increment_attempts=True
                )
            except Exception:
                pass
            raise _StageFailure() from e

        transcript = t_result.get("transcript", "")
        duration_seconds = float(t_result.get("duration_seconds", 0.0))
        try:
            await mongo_service.update_call_transcript(
                call_id, transcript, duration_seconds
            )
        except Exception:
            pass

        # Stage 3: questionnaire + GPT (gpt_service logs analysis_* stages)
        questions_raw = await mongo_service.get_all_questions()
        questions_list: list[dict[str, Any]] = []
        try:
            for q in questions_raw:
                questions_list.append(
                    {
                        "question_id": q.get("question_id", ""),
                        "question": q.get("question", ""),
                        "category": q.get("category", ""),
                        "is_active": q.get("is_active", True),
                    }
                )
        except Exception:
            questions_list = []

        try:
            analysis = await gpt_service.analyze_call(
                transcript, questions_list, call_id
            )
        except Exception as e:
            try:
                await mongo_service.update_call_status(call_id, CallStatus.failed)
            except Exception:
                pass
            try:
                await mongo_service.update_queue_status(
                    queue_id, "failed", increment_attempts=True
                )
            except Exception:
                pass
            raise _StageFailure() from e

        # Stage 4: persist analysis
        try:
            agent_name = str(analysis.get("agent_name") or "Not Found")
            customer_name = str(analysis.get("customer_name") or "Not Found")
            summary = str(analysis.get("summary") or "")
            sentiment = _normalize_sentiment(str(analysis.get("sentiment") or "neutral"))
            overall_score = float(analysis.get("overall_score") or 0.0)
            talk_time = analysis.get("talk_time") or {}
            agent_scores = analysis.get("agent_scores") or {}
            keywords = list(analysis.get("keywords") or [])
            action_items = list(analysis.get("action_items") or [])
            q_cov = list(analysis.get("questionnaire_coverage") or [])
            pos = list(analysis.get("positive_observations") or [])
            neg = list(analysis.get("negative_observations") or [])

            await mongo_service.update_call_analysis(
                call_id=call_id,
                agent_name=agent_name,
                customer_name=customer_name,
                summary=summary,
                sentiment=sentiment,
                overall_score=overall_score,
                talk_time=talk_time if isinstance(talk_time, dict) else {},
                agent_scores=agent_scores if isinstance(agent_scores, dict) else {},
                keywords=keywords,
                action_items=action_items,
                questionnaire_coverage=[
                    c for c in q_cov if isinstance(c, dict)
                ],
                positive_observations=pos,
                negative_observations=neg,
                status=CallStatus.completed,
            )
        except Exception as e:
            try:
                await mongo_service.update_call_status(call_id, CallStatus.failed)
            except Exception:
                pass
            try:
                await mongo_service.update_queue_status(
                    queue_id, "failed", increment_attempts=True
                )
            except Exception:
                pass
            try:
                await logger_service.log_stage(
                    call_id=call_id,
                    file_name=file_name,
                    stage="saving_failed",
                    status=StageStatus.failed,
                    message="Failed to save analysis results",
                    error=str(e),
                )
            except Exception:
                pass
            raise _StageFailure() from e

        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="saving_completed",
                status=StageStatus.success,
                message="Analysis results saved",
            )
        except Exception:
            pass

        # Stage 5: dashboard stats
        try:
            stats = await mongo_service.recalculate_dashboard_stats()
            await mongo_service.upsert_stats(stats)
        except Exception as e:
            try:
                await logger_service.log_stage(
                    call_id=call_id,
                    file_name=file_name,
                    stage="stats_update_failed",
                    status=StageStatus.failed,
                    message="Failed to update dashboard stats",
                    error=str(e),
                )
            except Exception:
                pass
        else:
            try:
                await logger_service.log_stage(
                    call_id=call_id,
                    file_name=file_name,
                    stage="stats_updated",
                    status=StageStatus.success,
                    message="Dashboard statistics refreshed",
                )
            except Exception:
                pass

        # Stage 6: finalize queue + processed_at
        try:
            await mongo_service.update_queue_status(
                queue_id, "completed", set_completed=True
            )
        except Exception:
            pass
        try:
            await mongo_service.set_call_processed_at_now(call_id)
        except Exception:
            pass
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="completed",
                status=StageStatus.success,
                message="Call processed successfully",
            )
        except Exception:
            pass

    except _StageFailure:
        return
    except Exception as e:
        try:
            await logger_service.log_stage(
                call_id=call_id or "unknown",
                file_name=file_name,
                stage="pipeline_failed",
                status=StageStatus.failed,
                message="Unhandled pipeline error",
                error=str(e),
            )
        except Exception:
            pass
        try:
            if call_id:
                await mongo_service.update_call_status(call_id, CallStatus.failed)
        except Exception:
            pass
        try:
            await mongo_service.update_queue_status(
                queue_id, "failed", increment_attempts=True
            )
        except Exception:
            pass
        raise
