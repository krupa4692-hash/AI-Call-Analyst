import type { ObservationItem } from "@/lib/api";
import clsx from "clsx";

export function ObservationCard({
  type,
  title,
  items,
}: {
  type: "positive" | "negative";
  title: string;
  items: ObservationItem[];
}) {
  const isPos = type === "positive";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No items to show.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((it, idx) => (
            <li
              key={`${it.observation}-${idx}`}
              className={clsx(
                "rounded-xl border p-4 shadow-sm",
                isPos ? "border-l-4 border-l-[#10B981] bg-[#F0FDF4]" : "border-l-4 border-l-[#EF4444] bg-[#FEF2F2]",
              )}
            >
              <p className={clsx("text-sm font-bold", isPos ? "text-[#10B981]" : "text-[#EF4444]")}>
                {isPos ? "✅ " : "❌ "}
                {it.observation}
              </p>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Why:</p>
                <p className="mt-1 text-sm text-slate-600">{it.evidence}</p>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                  {isPos ? "Agent said:" : "Key moment:"}
                </p>
                <blockquote className="mt-1 rounded-lg border border-[#E2E8F0] bg-white/70 p-3 text-sm italic text-slate-600">
                  {it.quote}
                </blockquote>
              </div>
              <div className="mt-3">
                <p
                  className={clsx(
                    "text-xs font-semibold",
                    isPos ? "text-[#10B981]" : "text-[#EF4444]",
                  )}
                >
                  {isPos ? "💡 Keep doing:" : "💡 Improve by:"}
                </p>
                <p className={clsx("mt-1 text-sm", isPos ? "text-[#047857]" : "text-orange-700")}>
                  {it.coaching_tip}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
