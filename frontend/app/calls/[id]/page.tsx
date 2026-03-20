"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { getCallById, getCallId, type CallDetail } from "@/lib/api";
import { getScoreTier } from "@/lib/score";
import { ActionItems } from "@/components/ActionItems";
import { AgentScores } from "@/components/AgentScores";
import { AudioPlayer } from "@/components/AudioPlayer";
import { KeywordTags } from "@/components/KeywordTags";
import { ObservationCard } from "@/components/ObservationCard";
import { QuestionnaireTable } from "@/components/QuestionnaireTable";
import { ScoreGauge } from "@/components/ScoreGauge";
import { TalkTimeBar } from "@/components/TalkTimeBar";
import { TranscriptView } from "@/components/TranscriptView";
import clsx from "clsx";

function SkeletonSection({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-2xl bg-slate-100", className)} aria-hidden />;
}

function formatDurationMin(sec: number | null | undefined): string {
  if (sec == null || Number.isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m} min ${s} sec`;
}

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [call, setCall] = useState<CallDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    const c = await getCallById(id);
    if (c === null) {
      setCall(null);
      setNotFound(true);
    } else {
      setCall(c);
      setNotFound(false);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <SkeletonSection className="h-10 w-48" />
        <SkeletonSection className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonSection className="h-56" />
          <SkeletonSection className="h-56" />
        </div>
        <SkeletonSection className="h-64 w-full" />
      </div>
    );
  }

  if (notFound || !call) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold text-slate-800">Call not found</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const cid = getCallId(call) || id;
  const sent = call.sentiment;
  const score = call.overall_score;

  const sentimentLabel =
    sent === "positive"
      ? "POSITIVE 😊"
      : sent === "neutral"
        ? "NEUTRAL 😐"
        : sent === "negative"
          ? "NEGATIVE 😞"
          : "UNKNOWN";

  const sentimentCls =
    sent === "positive"
      ? "bg-[#F0FDF4] text-[#10B981]"
      : sent === "neutral"
        ? "bg-[#FFFBEB] text-[#F59E0B]"
        : sent === "negative"
          ? "bg-[#FEF2F2] text-[#EF4444]"
          : "bg-slate-100 text-slate-600";

  const scoreTier = getScoreTier(score);
  const scorePillCls =
    scoreTier === "green"
      ? "bg-[#F0FDF4] text-[#10B981]"
      : scoreTier === "amber"
        ? "bg-[#FFFBEB] text-[#F59E0B]"
        : "bg-[#FEF2F2] text-[#EF4444]";

  const processed =
    call.processed_at != null
      ? format(new Date(call.processed_at), "MMM d, yyyy · h:mm a")
      : "—";

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in-card">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#3B82F6] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <header className="animate-slide-up-section space-y-2 border-b border-[#E2E8F0] pb-6">
        <h1 className="text-2xl font-bold text-slate-900">{call.file_name}</h1>
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Agent:</span> {call.agent_name}
          <span className="mx-2 text-slate-300">|</span>
          <span className="font-semibold text-slate-800">Customer:</span> {call.customer_name}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <span className={clsx("rounded-full px-3 py-1 text-xs font-bold", sentimentCls)}>{sentimentLabel}</span>
          <span className={clsx("rounded-full px-3 py-1 text-xs font-bold", scorePillCls)}>
            Score: {score != null ? `${score.toFixed(1)}` : "—"}{" "}
            {scoreTier === "green" ? "🟢" : scoreTier === "amber" ? "🟡" : "🔴"}
          </span>
        </div>
      </header>

      <section className="animate-slide-up-section rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Call Summary</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {call.summary?.trim() ? call.summary : "No summary available for this call."}
        </p>
        <p className="mt-4 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Processed:</span> {processed}
          <span className="mx-2 text-slate-300">|</span>
          <span className="font-semibold text-slate-600">Duration:</span>{" "}
          {formatDurationMin(call.duration_seconds)}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-slide-up-section">
        <AudioPlayer callId={cid} fileName={call.file_name} />
        <TranscriptView transcript={call.transcript ?? ""} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-slide-up-section">
        <TalkTimeBar talkTime={call.talk_time} />
        <ScoreGauge score={score ?? null} label="Overall Call Score" />
      </section>

      <section className="animate-slide-up-section">
        <AgentScores scores={call.agent_scores ?? null} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5 animate-slide-up-section">
        <div className="lg:col-span-3">
          <QuestionnaireTable rows={call.questionnaire_coverage} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <KeywordTags keywords={call.keywords} />
          <ActionItems items={call.action_items} />
        </div>
      </section>

      <section className="animate-slide-up-section space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Call Analysis &amp; Coaching Insights</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ObservationCard
            type="positive"
            title="✅ What Went Well"
            items={call.positive_observations ?? []}
          />
          <ObservationCard
            type="negative"
            title="❌ Areas for Improvement"
            items={call.negative_observations ?? []}
          />
        </div>
      </section>
    </div>
  );
}
