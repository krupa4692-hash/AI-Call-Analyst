import type { DashboardStats } from "@/lib/api";
import clsx from "clsx";

function chipStyles(count: number): {
  chip: string;
  badge: string;
} {
  if (count >= 4) {
    return {
      chip: "bg-[#4F46E5] text-white shadow-sm",
      badge: "bg-indigo-800/90 text-white",
    };
  }
  if (count === 3) {
    return {
      chip: "bg-[#6366F1] text-white shadow-sm",
      badge: "bg-indigo-700/90 text-white",
    };
  }
  if (count === 2) {
    return {
      chip: "bg-[#EEF2FF] text-indigo-900 ring-1 ring-indigo-100",
      badge: "bg-indigo-200/90 text-indigo-900",
    };
  }
  return {
    chip: "bg-[#F8FAFC] text-slate-700 ring-1 ring-slate-200/80",
    badge: "bg-slate-200/90 text-slate-800",
  };
}

export function KeywordsPanel({ stats }: { stats: DashboardStats }) {
  const items = [...(stats.top_keywords ?? [])].sort((a, b) => b.count - a.count);

  return (
    <div className="card-premium rounded-2xl border border-[#F1F5F9] bg-white p-6 shadow-[var(--shadow-sm)]">
      <h3 className="text-lg font-semibold text-slate-800">Most Discussed Topics</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No keywords yet.</p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {items.map((k) => {
            const { chip, badge } = chipStyles(k.count);
            return (
              <span
                key={k.keyword}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 hover:scale-[1.02]",
                  chip,
                )}
              >
                {k.keyword}
                <span
                  className={clsx(
                    "flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-bold",
                    badge,
                  )}
                >
                  {k.count}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
