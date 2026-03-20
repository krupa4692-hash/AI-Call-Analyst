"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw } from "lucide-react";
import {
  getAllCalls,
  getDashboardStats,
  type CallListItem,
  type DashboardStats,
} from "@/lib/api";
import { CallsTable } from "@/components/CallsTable";
import { KeywordsPanel } from "@/components/KeywordsPanel";
import { SentimentChart } from "@/components/SentimentChart";
import { StatsBar } from "@/components/StatsBar";
import { TeamHealthBar } from "@/components/TeamHealthBar";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-100 ${className ?? ""}`}
      aria-hidden
    />
  );
}

type LoadMode = "initial" | "poll" | "manual";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{children}</p>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calls, setCalls] = useState<CallListItem[] | null>(null);
  const [apiError, setApiError] = useState(false);

  const load = useCallback((mode: LoadMode) => {
    void (async () => {
      if (mode === "initial") setLoading(true);
      if (mode === "manual") setRefreshing(true);

      const [s, c] = await Promise.all([getDashboardStats(), getAllCalls()]);
      setStats(s);
      setCalls(c);
      setApiError(s === null || c === null);

      setLoading(false);
      setRefreshing(false);
    })();
  }, []);

  useEffect(() => {
    load("initial");
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => load("poll"), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const sortedCalls = [...(calls ?? [])].sort((a, b) => {
    const ta = a.processed_at ? new Date(a.processed_at).getTime() : 0;
    const tb = b.processed_at ? new Date(b.processed_at).getTime() : 0;
    return tb - ta;
  });

  const lastUpdated =
    stats?.last_updated != null
      ? formatDistanceToNow(new Date(stats.last_updated), { addSuffix: true })
      : "—";

  const emptyStats: DashboardStats = {
    total_calls: 0,
    avg_call_score: null,
    avg_duration_seconds: null,
    sentiment_split: {},
    top_keywords: [],
    total_action_items: 0,
    last_updated: null,
  };

  const displayStats = stats ?? emptyStats;

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-card flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sales Call Dashboard</h1>
          <p className="mt-1 text-slate-500">Real-time AI analysis of your sales team</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <p className="text-xs text-slate-400">
            Last updated{" "}
            <span className="font-medium text-slate-600">{lastUpdated}</span>
          </p>
          <button
            type="button"
            onClick={() => load("manual")}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-[var(--shadow-sm)] transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {apiError ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600"
          role="alert"
        >
          Cannot connect to API
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-8">
          <SkeletonBlock className="h-28 w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-40 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <SkeletonBlock className="h-64 lg:col-span-5" />
            <SkeletonBlock className="h-64 lg:col-span-7" />
          </div>
          <SkeletonBlock className="h-96 w-full" />
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <SectionLabel>Team health</SectionLabel>
            <div className="mt-3 animate-slide-up-section">
              <TeamHealthBar stats={displayStats} calls={sortedCalls} />
            </div>
          </div>

          <hr className="border-0 border-t border-slate-100" />

          <div>
            <SectionLabel>Performance overview</SectionLabel>
            <div className="mt-3 animate-slide-up-section" style={{ animationDelay: "40ms" }}>
              <StatsBar stats={displayStats} />
            </div>
          </div>

          <hr className="border-0 border-t border-slate-100" />

          <div>
            <SectionLabel>Insights</SectionLabel>
            <div
              className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-12 animate-slide-up-section"
              style={{ animationDelay: "80ms" }}
            >
              <div className="lg:col-span-5">
                <SentimentChart stats={displayStats} />
              </div>
              <div className="lg:col-span-7">
                <KeywordsPanel stats={displayStats} />
              </div>
            </div>
          </div>

          <hr className="border-0 border-t border-slate-100" />

          <div>
            <SectionLabel>Call log</SectionLabel>
            <div className="mt-3 animate-slide-up-section" style={{ animationDelay: "120ms" }}>
              <CallsTable calls={sortedCalls} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
