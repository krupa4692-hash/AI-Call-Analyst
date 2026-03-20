"""GPT-4o JSON analysis for sales call transcripts."""

import json
from typing import Any, Optional

from openai import APIError, AsyncOpenAI, OpenAIError
from pydantic import BaseModel, Field, ValidationError

from config import settings
from models.schemas import Observation, StageStatus
from services import logger_service

GPT_MODEL = "gpt-4o"


class GptAnalysisResult(BaseModel):
    """Expected JSON object from the model (validated after parse)."""

    agent_name: str = "Not Found"
    customer_name: str = "Not Found"
    summary: str = ""
    sentiment: str = "neutral"
    overall_score: float = Field(default=5.0, ge=0, le=10)
    talk_time: dict[str, Any] = Field(
        default_factory=lambda: {"agent_percent": 50.0, "customer_percent": 50.0}
    )
    agent_scores: dict[str, Any] = Field(default_factory=dict)
    keywords: list[str] = Field(default_factory=list)
    action_items: list[str] = Field(default_factory=list)
    questionnaire_coverage: list[dict[str, Any]] = Field(default_factory=list)
    positive_observations: list[Observation] = Field(default_factory=list)
    negative_observations: list[Observation] = Field(default_factory=list)


def _build_system_prompt() -> str:
    return (
        "You are an expert sales call analyzer. Analyze the "
        "provided sales call transcript and return a JSON object. "
        "Return ONLY valid JSON, no markdown, no explanation.\n\n"
        "STRICT SCORING RULES - Follow these exactly:\n"
        "1. Scores must reflect ACTUAL conversation behavior\n"
        "2. Never inflate scores to be nice - be tough but fair\n"
        "3. Negative sentiment calls should rarely score above 6.0\n"
        "4. Score each dimension based on specific evidence:\n\n"
        "   Communication Clarity (1-10):\n"
        "   - Was information explained clearly first time?\n"
        "   - Did customer ask same question multiple times? (deduct 2 points each time)\n"
        "   - Was pricing/process explained simply?\n\n"
        "   Politeness (1-10):\n"
        "   - Was tone consistently respectful throughout?\n"
        "   - If agent told customer to go elsewhere → max 5/10\n"
        "   - If agent was defensive → max 6/10\n"
        "   - If agent used dismissive language → max 4/10\n\n"
        "   Business Knowledge (1-10):\n"
        "   - Did agent know product/pricing details?\n"
        "   - Could agent answer questions directly?\n"
        "   - If agent could not give direct answers → max 5/10\n\n"
        "   Problem Handling (1-10):\n"
        "   - Did agent resolve customer concerns?\n"
        "   - If customer left more frustrated → max 4/10\n"
        "   - If agent deflected questions repeatedly → max 5/10\n"
        "   - If agent suggested customer go elsewhere → max 3/10\n\n"
        "   Listening Ability (1-10):\n"
        "   - Did agent address what customer actually asked?\n"
        "   - Did agent interrupt or talk over customer?\n"
        "   - If customer repeated same concern 3+ times and agent did not address it → max 4/10\n\n"
        "5. Overall Score calculation:\n"
        "   - Average of 5 dimension scores\n"
        "   - Then adjust based on call outcome:\n"
        "     Customer satisfied → keep score\n"
        "     Customer neutral → subtract 0.5\n"
        "     Customer frustrated → subtract 1.0\n"
        "     Customer threatened to leave → subtract 1.5\n"
        "     Customer left/ended call badly → subtract 2.0\n"
        "   - Minimum score: 1.0, Maximum score: 10.0\n\n"
        "6. Talk time estimation rules:\n"
        "   - Count approximate lines of dialogue per speaker\n"
        "   - Agent lines / total lines = agent percent\n"
        "   - Be realistic - if customer complained a lot, customer likely spoke more than 40%\n\n"
        "7. Sentiment rules:\n"
        "   - positive: customer satisfied, agreed to next steps\n"
        "   - neutral: call ended okay, no strong emotion either way\n"
        "   - negative: customer frustrated, complained, threatened to leave, or ended call badly"
    )


def _build_user_prompt(transcript: str, questions_list: list[dict[str, Any]]) -> str:
    q_json = json.dumps(questions_list, ensure_ascii=False)
    return (
        "Transcript:\n"
        f"{transcript}\n\n"
        "Questionnaire items (include coverage for each by question_id):\n"
        f"{q_json}\n\n"
        "Respond with a JSON object exactly matching this structure and key names:\n"
        "{\n"
        '  "agent_name": "extracted name or Not Found",\n'
        '  "customer_name": "extracted name or Not Found",\n'
        '  "summary": "2-3 sentence summary of the call",\n'
        '  "sentiment": "positive or neutral or negative",\n'
        '  "overall_score": 7.5,\n'
        '  "talk_time": {\n'
        '    "agent_percent": 60,\n'
        '    "customer_percent": 40\n'
        '  },\n'
        '  "agent_scores": {\n'
        '    "communication_clarity": 8,\n'
        '    "politeness": 9,\n'
        '    "business_knowledge": 7,\n'
        '    "problem_handling": 8,\n'
        '    "listening_ability": 6\n'
        "  },\n"
        '  "keywords": ["budget", "cabinet style", "installation"],\n'
        '  "action_items": [\n'
        '    "Send updated quote to customer"\n'
        "  ],\n"
        '  "questionnaire_coverage": [\n'
        '    {"question_id": "Q1", "question": "...", "asked": true}\n'
        "  ],\n"
        '  "positive_observations": [\n'
        "    {\n"
        '      "observation": "Brief title of what went well",\n'
        '      "evidence": "Detailed explanation of why this moment was positive, referencing what happened in the conversation",\n'
        '      "quote": "Exact words from the transcript that demonstrate this positive behavior (max 2 sentences, word for word)",\n'
        '      "coaching_tip": "Specific advice on how to keep doing this well and build on it"\n'
        "    }\n"
        "  ],\n"
        '  "negative_observations": [\n'
        "    {\n"
        '      "observation": "Brief title of what went wrong",\n'
        '      "evidence": "Detailed explanation of why this moment was negative, referencing specific customer reactions or agent mistakes",\n'
        '      "quote": "Exact words from the transcript that demonstrate this problem (max 2 sentences, word for word)",\n'
        '      "coaching_tip": "Specific actionable step the agent can take to improve this next time, with a concrete example of better phrasing or approach"\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )


async def analyze_call(
    transcript: str,
    questions_list: list[dict[str, Any]],
    call_id: str,
) -> dict[str, Any]:
    """
    Run GPT analysis with JSON-only output, validate, and return a plain dict.
    Logs analysis_started / analysis_completed / analysis_failed with token usage.
    """
    file_name = f"call_{call_id}"

    try:
        await logger_service.log_stage(
            call_id=call_id,
            file_name=file_name,
            stage="analysis_started",
            status=StageStatus.started,
            message="GPT analysis started",
            metadata={"gpt_model": GPT_MODEL},
        )
    except Exception:
        pass

    client: AsyncOpenAI
    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=120.0)
    except Exception as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="analysis_failed",
                status=StageStatus.failed,
                message="Failed to create OpenAI client",
                error=str(e),
            )
        except Exception:
            pass
        raise

    try:
        completion = await client.chat.completions.create(
            model=GPT_MODEL,
            messages=[
                {"role": "system", "content": _build_system_prompt()},
                {"role": "user", "content": _build_user_prompt(transcript, questions_list)},
            ],
            response_format={"type": "json_object"},
        )
    except APIError as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="analysis_failed",
                status=StageStatus.failed,
                message="OpenAI API error during analysis",
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
                stage="analysis_failed",
                status=StageStatus.failed,
                message="OpenAI error during analysis",
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
                stage="analysis_failed",
                status=StageStatus.failed,
                message="Unexpected error during analysis request",
                error=str(e),
            )
        except Exception:
            pass
        raise

    tokens_used: Optional[int] = None
    try:
        usage = getattr(completion, "usage", None)
        if usage is not None:
            tokens_used = getattr(usage, "total_tokens", None)
    except Exception:
        tokens_used = None

    raw_content = ""
    try:
        choice0 = completion.choices[0]
        raw_content = (choice0.message.content or "").strip()
    except Exception as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="analysis_failed",
                status=StageStatus.failed,
                message="Empty or invalid completion",
                error=str(e),
                metadata={"gpt_model": GPT_MODEL, "tokens_used": tokens_used},
            )
        except Exception:
            pass
        raise ValueError("GPT returned no message content") from e

    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="analysis_failed",
                status=StageStatus.failed,
                message="GPT returned invalid JSON",
                error=str(e),
                metadata={"gpt_model": GPT_MODEL, "tokens_used": tokens_used},
            )
        except Exception:
            pass
        raise

    try:
        model = GptAnalysisResult.model_validate(parsed)
    except ValidationError as e:
        try:
            await logger_service.log_stage(
                call_id=call_id,
                file_name=file_name,
                stage="analysis_failed",
                status=StageStatus.failed,
                message="JSON failed schema validation",
                error=str(e),
                metadata={"gpt_model": GPT_MODEL, "tokens_used": tokens_used},
            )
        except Exception:
            pass
        raise

    try:
        await logger_service.log_stage(
            call_id=call_id,
            file_name=file_name,
            stage="analysis_completed",
            status=StageStatus.success,
            message="GPT analysis completed",
            metadata={"gpt_model": GPT_MODEL, "tokens_used": tokens_used},
        )
    except Exception:
        pass

    return model.model_dump()
