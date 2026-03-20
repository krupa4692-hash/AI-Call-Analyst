"""Pydantic schemas for API responses and MongoDB documents."""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class CallStatus(str, Enum):
    """Lifecycle status for a call document."""

    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class StageStatus(str, Enum):
    """Status of a pipeline stage recorded in logs."""

    started = "started"
    success = "success"
    failed = "failed"


class SentimentType(str, Enum):
    """Call-level sentiment classification."""

    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class ReviewStatus(str, Enum):
    """Manual review state for analyzed calls."""

    pending = "pending"
    done = "done"


class TalkTime(BaseModel):
    """Estimated share of talk time between agent and customer (percent)."""

    agent_percent: float = Field(..., ge=0, le=100)
    customer_percent: float = Field(..., ge=0, le=100)


class AgentScores(BaseModel):
    """Rubric scores for the sales agent (1–10)."""

    communication_clarity: float = Field(..., ge=1, le=10)
    politeness: float = Field(..., ge=1, le=10)
    business_knowledge: float = Field(..., ge=1, le=10)
    problem_handling: float = Field(..., ge=1, le=10)
    listening_ability: float = Field(..., ge=1, le=10)


class QuestionnaireCoverage(BaseModel):
    """Whether a seeded questionnaire item was addressed in the call."""

    question_id: str
    question: str
    asked: bool


class Observation(BaseModel):
    """Structured coaching observation with evidence and transcript quote."""

    observation: str = Field(
        description="Brief title of what was observed"
    )
    evidence: str = Field(
        description=(
            "Explanation of why GPT flagged this, referencing specific conversation context"
        )
    )
    quote: str = Field(
        description=(
            "Exact quote from transcript max 2 sentences that demonstrates this point"
        )
    )
    coaching_tip: str = Field(
        description=(
            "Specific actionable advice for the agent to improve or maintain this behavior"
        )
    )


class LogMetadata(BaseModel):
    """Optional metadata attached to pipeline log entries."""

    whisper_model: Optional[str] = None
    gpt_model: Optional[str] = None
    tokens_used: Optional[int] = None
    duration_ms: Optional[float] = None


class CallDocument(BaseModel):
    """Full document shape for the `calls` collection."""

    id: Optional[str] = None
    file_name: str
    file_path: str
    agent_name: str = "Not Found"
    customer_name: str = "Not Found"
    duration_seconds: Optional[float] = None
    processed_at: Optional[datetime] = None
    status: CallStatus = CallStatus.pending
    review_status: ReviewStatus = ReviewStatus.pending
    transcript: Optional[str] = None
    summary: Optional[str] = None
    sentiment: Optional[SentimentType] = None
    overall_score: Optional[float] = None
    talk_time: Optional[TalkTime] = None
    agent_scores: Optional[AgentScores] = None
    keywords: list[str] = Field(default_factory=list)
    action_items: list[str] = Field(default_factory=list)
    questionnaire_coverage: list[QuestionnaireCoverage] = Field(default_factory=list)
    positive_observations: list[Observation] = Field(default_factory=list)
    negative_observations: list[Observation] = Field(default_factory=list)


class DashboardStats(BaseModel):
    """Aggregated metrics for the dashboard."""

    last_updated: Optional[datetime] = None
    total_calls: int = 0
    avg_call_score: Optional[float] = None
    avg_duration_seconds: Optional[float] = None
    sentiment_split: dict[str, int] = Field(default_factory=dict)
    top_keywords: list[dict[str, Any]] = Field(default_factory=list)
    total_action_items: int = 0


class QuestionnaireItem(BaseModel):
    """A single questionnaire row stored in MongoDB."""

    question_id: str
    question: str
    category: str
    is_active: bool = True
    created_at: datetime


class CallLog(BaseModel):
    """A log line for a pipeline stage."""

    id: Optional[str] = None
    call_id: str
    file_name: str
    stage: str
    status: StageStatus
    message: str
    error: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime


class ProcessingQueue(BaseModel):
    """Queue item for background processing of recording files."""

    id: Optional[str] = None
    file_name: str
    file_path: str
    priority: int = 0
    status: str = "queued"
    attempts: int = 0
    max_attempts: int = 3
    queued_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class CallListItem(BaseModel):
    """Subset of call fields returned by GET /api/calls."""

    id: str
    file_name: str
    agent_name: str = "Not Found"
    customer_name: str = "Not Found"
    duration_seconds: Optional[float] = None
    overall_score: Optional[float] = None
    sentiment: Optional[SentimentType] = None
    review_status: ReviewStatus = ReviewStatus.pending
    status: CallStatus
    processed_at: Optional[datetime] = None
