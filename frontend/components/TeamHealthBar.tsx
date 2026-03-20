import { AlertTriangle, Check, ShieldAlert } from "lucide-react";
import type { CallListItem, DashboardStats } from "@/lib/api";
import clsx from "clsx";

type Band = "excellent" | "attention" | "critical";

function getPendingNegativeCount(calls: CallListItem[]): number {
  return calls.filter(
    (call) =>
      call.sentiment === "negative" &&
      (call.review_status ?? "pending") === "pending",
  ).length;
}

function resolveBand(avg: number, pendingNegativeCount: number): Band {
  if (avg >= 8 && pendingNegativeCount === 0) return "excellent";
  if (avg >= 6 && pendingNegativeCount <= 2) return "attention";
  return "critical";
}

export function TeamHealthBar({
  stats,
  calls,
}: {
  stats: DashboardStats;
  calls: CallListItem[];
}) {
  const avg = stats.avg_call_score ?? 0;
  const pendingNegativeCount = getPendingNegativeCount(calls);
  const band = resolveBand(avg, pendingNegativeCount);

  const pendingReviewsTextColor = pendingNegativeCount > 0 ? "text-red-600" : "text-emerald-600";

  if (band === "excellent") {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-emerald-300 p-6 pl-7 shadow-[var(--shadow-sm)]"
        style={{
          background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
          borderLeftWidth: 4,
          borderLeftColor: "#10B981",
        }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
              <Check className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-800">Team Performance: Excellent</h2>
              <p className="mt-1 max-w-2xl text-sm text-green-600">
                All negative calls have been reviewed!
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-white px-5 py-4 text-right shadow-[var(--shadow-sm)] ring-1 ring-emerald-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">PENDING REVIEWS</p>
            <p className={clsx("text-3xl font-bold tabular-nums", pendingReviewsTextColor)}>
              {pendingNegativeCount}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (band === "attention") {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-amber-300 p-6 pl-7 shadow-[var(--shadow-sm)]"
        style={{
          background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
          borderLeftWidth: 4,
          borderLeftColor: "#F59E0B",
        }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white shadow-md">
              <AlertTriangle className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-800">Team Performance: Needs Attention</h2>
              <p className="mt-1 max-w-2xl text-sm text-amber-700">
                {pendingNegativeCount} negative calls pending review
              </p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-white px-5 py-4 text-right shadow-[var(--shadow-sm)] ring-1 ring-amber-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">PENDING REVIEWS</p>
            <p className={clsx("mt-1 text-3xl font-bold tabular-nums", pendingReviewsTextColor)}>
              {pendingNegativeCount}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-red-300 p-6 pl-7 shadow-[var(--shadow-sm)]"
      style={{
        background: "linear-gradient(135deg, #FFF1F2, #FFE4E6)",
        borderLeftWidth: 4,
        borderLeftColor: "#EF4444",
      }}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 animate-pulse items-center justify-center rounded-full bg-red-500 text-white shadow-md">
            <ShieldAlert className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-800">Team Performance: Critical</h2>
            <p className="mt-1 max-w-2xl text-sm text-red-700">
              {pendingNegativeCount} negative calls need immediate review
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded-xl bg-white px-5 py-4 text-right shadow-[var(--shadow-sm)] ring-1 ring-red-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">PENDING REVIEWS</p>
          <p className={clsx("mt-1 text-3xl font-bold tabular-nums", pendingReviewsTextColor)}>
            {pendingNegativeCount}
          </p>
        </div>
      </div>
    </div>
  );
}
