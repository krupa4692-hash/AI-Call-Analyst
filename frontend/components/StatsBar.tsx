import { CheckSquare, Clock, PhoneCall, Star } from "lucide-react";
import type { DashboardStats } from "@/lib/api";
import { getScoreClasses, getScoreTier } from "@/lib/score";
import clsx from "clsx";

function formatDurationCompact(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

const cardFrame =
  "card-premium flex flex-col rounded-2xl border border-[#F1F5F9] bg-white p-6 shadow-[var(--shadow-sm)]";

export function StatsBar({ stats }: { stats: DashboardStats }) {
  const split = stats.sentiment_split ?? {};
  const pos = split.positive ?? 0;
  const neu = split.neutral ?? 0;
  const neg = split.negative ?? 0;
  const totalSent = pos + neu + neg || 1;
  const pct = (n: number) => Math.round((n / totalSent) * 100);

  const avg = stats.avg_call_score;
  const scoreTier = getScoreTier(avg);
  const scoreCls = getScoreClasses(avg);

  const scoreIconBox =
    scoreTier === "green"
      ? "bg-emerald-50 text-emerald-600"
      : scoreTier === "amber"
        ? "bg-amber-50 text-amber-600"
        : "bg-red-50 text-red-600";

  const actions = stats.total_action_items;
  const actionsUrgent = actions > 10;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Card 1 — Total calls */}
      <div className={clsx(cardFrame, "border-t-4 border-t-blue-500")}>
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <PhoneCall className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        <p className="mt-5 text-3xl font-bold tabular-nums text-slate-900">{stats.total_calls}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">Total Calls Analyzed</p>
        <div className="mt-4 h-1 w-full rounded-full bg-blue-500/15" />
      </div>

      {/* Card 2 — Avg score */}
      <div
        className={clsx(
          cardFrame,
          scoreTier === "green" && "border-t-4 border-t-emerald-500",
          scoreTier === "amber" && "border-t-4 border-t-amber-500",
          scoreTier === "red" && "border-t-4 border-t-red-500",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className={clsx("rounded-xl p-2.5", scoreIconBox)}>
            <Star className="h-5 w-5" strokeWidth={2} fill="currentColor" />
          </div>
        </div>
        <p className={clsx("mt-5 text-3xl font-bold tabular-nums sm:text-4xl", scoreCls.text)}>
          {avg != null ? avg.toFixed(1) : "—"}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">out of 10</p>
        <p className="mt-3 text-sm font-medium text-slate-500">Average Call Score</p>
        <div className={clsx("mt-4 h-1 w-full rounded-full opacity-30", scoreCls.bar)} />
      </div>

      {/* Card 3 — Sentiment (no icon box) */}
      <div className={clsx(cardFrame, "border-t-4 border-t-slate-300")}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sentiment</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-700">
              <span className="text-base">🟢</span> Positive
            </span>
            <span className="text-right">
              <span className="font-bold text-slate-900">{pos}</span>
              <span className="ml-2 text-slate-500">{pct(pos)}%</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-700">
              <span className="text-base">🟡</span> Neutral
            </span>
            <span className="text-right">
              <span className="font-bold text-slate-900">{neu}</span>
              <span className="ml-2 text-slate-500">{pct(neu)}%</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-700">
              <span className="text-base">🔴</span> Negative
            </span>
            <span className="text-right">
              <span className="font-bold text-slate-900">{neg}</span>
              <span className="ml-2 text-slate-500">{pct(neg)}%</span>
            </span>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">Sentiment Overview</p>
        <div className="mt-3 h-1 w-full rounded-full bg-slate-200" />
      </div>

      {/* Card 4 — Duration */}
      <div className={clsx(cardFrame, "border-t-4 border-t-blue-500")}>
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Clock className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        <p className="mt-5 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
          {formatDurationCompact(stats.avg_duration_seconds)}
        </p>
        <p className="mt-1 text-xs text-slate-400">per call average</p>
        <p className="mt-3 text-sm font-medium text-slate-500">Avg Call Duration</p>
        <div className="mt-4 h-1 w-full rounded-full bg-blue-500/15" />
      </div>

      {/* Card 5 — Actions */}
      <div
        className={clsx(
          cardFrame,
          actionsUrgent ? "border-t-4 border-t-amber-500 ring-1 ring-amber-100" : "border-t-4 border-t-violet-600",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={clsx(
              "rounded-xl p-2.5",
              actionsUrgent ? "bg-amber-50 text-amber-600" : "bg-violet-50 text-violet-600",
            )}
          >
            <CheckSquare className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        <p
          className={clsx(
            "mt-5 text-3xl font-bold tabular-nums",
            actionsUrgent ? "text-amber-700" : "text-slate-900",
          )}
        >
          {actions}
        </p>
        {actionsUrgent ? (
          <p className="mt-1 text-xs font-semibold text-amber-600">High follow-up volume — prioritize</p>
        ) : null}
        <p className="mt-3 text-sm font-medium text-slate-500">Follow-up Actions Found</p>
        <div
          className={clsx("mt-4 h-1 w-full rounded-full", actionsUrgent ? "bg-amber-400/30" : "bg-violet-600/20")}
        />
      </div>
    </div>
  );
}
