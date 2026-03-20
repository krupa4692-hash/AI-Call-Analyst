"use client";

import Link from "next/link";
import { ArrowRight, Check, FileAudio } from "lucide-react";
import { useMemo, useState } from "react";
import type { CallListItem } from "@/lib/api";
import { getCallId, updateReviewStatus } from "@/lib/api";
import { getScoreTier } from "@/lib/score";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";

function formatDuration(sec: number | null | undefined): string {
  if (sec == null || Number.isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function scoreBadge(score: number | null | undefined) {
  if (score == null) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-bold text-slate-600">
        —
      </span>
    );
  }
  const tier = getScoreTier(score);
  const sym = tier === "green" ? "✓" : tier === "amber" ? "~" : "✗";
  const cls =
    tier === "green"
      ? "border border-green-200 bg-green-50 text-green-700"
      : tier === "amber"
        ? "border border-amber-200 bg-amber-50 text-amber-700"
        : "border border-red-200 bg-red-50 text-red-700";
  return (
    <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-sm font-bold", cls)}>
      {score.toFixed(1)} {sym}
    </span>
  );
}

function sentimentBadge(s: CallListItem["sentiment"]) {
  if (!s) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-500">
        —
      </span>
    );
  }
  const map = {
    positive: { emoji: "😊", cls: "border border-green-200 bg-green-50 text-green-700" },
    neutral: { emoji: "😐", cls: "border border-amber-200 bg-amber-50 text-amber-700" },
    negative: { emoji: "😞", cls: "border border-red-200 bg-red-50 text-red-700" },
  }[s];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold capitalize",
        map.cls,
      )}
    >
      {map.emoji} {s}
    </span>
  );
}

function rowLeftBorder(call: CallListItem): string {
  if (call.status === "failed") return "border-l-[3px] border-l-red-500";
  if (call.status === "processing") return "border-l-[3px] border-l-blue-500";
  if (call.status === "pending") return "border-l-[3px] border-l-slate-300";
  if (call.status === "completed") {
    const sc = call.overall_score;
    if (sc == null) return "border-l-[3px] border-l-slate-300";
    const t = getScoreTier(sc);
    if (t === "green") return "border-l-[3px] border-l-emerald-500";
    if (t === "amber") return "border-l-[3px] border-l-amber-500";
    return "border-l-[3px] border-l-red-500";
  }
  return "border-l-[3px] border-l-transparent";
}

type ReviewStatus = "pending" | "done";

export function CallsTable({ calls }: { calls: CallListItem[] }) {
  const [reviewStatusMap, setReviewStatusMap] = useState<Record<string, ReviewStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const effectiveStatus = useMemo(() => {
    const map: Record<string, ReviewStatus> = {};
    for (const c of calls) {
      const cid = getCallId(c);
      if (!cid) continue;
      map[cid] = reviewStatusMap[cid] ?? (c.review_status ?? "pending");
    }
    return map;
  }, [calls, reviewStatusMap]);

  async function onReviewChange(call: CallListItem, next: ReviewStatus) {
    const callId = getCallId(call);
    if (!callId) return;

    const prev = effectiveStatus[callId] ?? "pending";
    setReviewStatusMap((curr) => ({ ...curr, [callId]: next }));
    setSavingId(callId);

    const ok = await updateReviewStatus(callId, next);

    setSavingId((curr) => (curr === callId ? null : curr));
    if (!ok) {
      setReviewStatusMap((curr) => ({ ...curr, [callId]: prev }));
      return;
    }

    setSavedId(callId);
    setTimeout(() => {
      setSavedId((curr) => (curr === callId ? null : curr));
    }, 1400);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F1F5F9] bg-white shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-800">All Calls</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {calls.length}
          </span>
        </div>
      </div>

      {calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <FileAudio className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-700">No calls processed yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Add audio files to call_recordings folder
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Call
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Agent
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Duration
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Score
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sentiment
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Review
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {calls.map((call) => {
                const id = getCallId(call);
                const when = call.processed_at
                  ? formatDistanceToNow(new Date(call.processed_at), { addSuffix: true })
                  : "—";
                const reviewStatus = id ? effectiveStatus[id] ?? "pending" : "pending";

                return (
                  <tr
                    key={id || call.file_name}
                    className={clsx(
                      "group border-b border-[#F8FAFC] transition-all duration-150 ease-out hover:bg-slate-50 cursor-pointer hover:-translate-y-px",
                      rowLeftBorder(call),
                    )}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">{call.file_name}</td>
                    <td className="px-6 py-4">{call.agent_name}</td>
                    <td className="px-6 py-4">{call.customer_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {formatDuration(call.duration_seconds ?? undefined)}
                    </td>
                    <td className="px-6 py-4">{scoreBadge(call.overall_score ?? null)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{sentimentBadge(call.sentiment)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={reviewStatus}
                          disabled={!id || savingId === id}
                          onChange={(e) => {
                            e.stopPropagation();
                            void onReviewChange(call, e.target.value as ReviewStatus);
                          }}
                          className={clsx(
                            "rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition",
                            reviewStatus === "pending"
                              ? "border border-amber-200 bg-amber-50 text-amber-700"
                              : "border border-green-200 bg-green-50 text-green-700",
                          )}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="done">✅ Reviewed</option>
                        </select>
                        {savedId === id ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <Check className="h-3.5 w-3.5" /> Saved
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{when}</td>
                    <td className="px-6 py-4">
                      {id ? (
                        <Link
                          href={`/calls/${id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition hover:text-indigo-800 hover:underline"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
