"use client";

import type { DashboardStats } from "@/lib/api";
import clsx from "clsx";

export function SentimentChart({ stats }: { stats: DashboardStats }) {
  const split = stats.sentiment_split ?? {};
  const pos = split.positive ?? 0;
  const neu = split.neutral ?? 0;
  const neg = split.negative ?? 0;
  const total = pos + neu + neg;
  const safeTotal = total > 0 ? total : 1;
  const pPos = (pos / safeTotal) * 100;
  const pNeu = (neu / safeTotal) * 100;
  const pNeg = (neg / safeTotal) * 100;

  const rows = [
    { key: "pos", label: "Positive", dot: "🟢", pct: pPos, count: pos, fill: "bg-emerald-500" },
    { key: "neu", label: "Neutral", dot: "🟡", pct: pNeu, count: neu, fill: "bg-amber-500" },
    { key: "neg", label: "Negative", dot: "🔴", pct: pNeg, count: neg, fill: "bg-red-500" },
  ];

  return (
    <div className="card-premium rounded-2xl border border-[#F1F5F9] bg-white p-6 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-800">Sentiment Breakdown</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {total} total
        </span>
      </div>
      <div className="mt-6 space-y-6">
        {rows.map((r, i) => (
          <div key={r.key} className="animate-slide-up-section" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">
                <span className="mr-2">{r.dot}</span>
                {r.label}
              </span>
              <span className="text-sm font-bold text-slate-900">{Math.round(r.pct)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className={clsx("sentiment-track-fill h-3 rounded-full", r.fill)}
                style={{ width: `${r.pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {r.count} {r.count === 1 ? "call" : "calls"}
            </p>
          </div>
        ))}
      </div>
      {total === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No sentiment data yet.</p>
      ) : (
        <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs font-medium text-slate-500">
          Based on {total} analyzed {total === 1 ? "call" : "calls"}
        </p>
      )}
    </div>
  );
}
