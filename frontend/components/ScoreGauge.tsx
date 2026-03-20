import { getScoreClasses, getScoreTier } from "@/lib/score";
import clsx from "clsx";

function sublabel(score: number): string {
  if (score >= 8) return "Excellent Performance";
  if (score >= 6) return "Good Performance";
  if (score >= 4) return "Needs Improvement";
  return "Poor Performance";
}

export function ScoreGauge({ score, label }: { score: number | null | undefined; label: string }) {
  const s = score ?? 0;
  const tier = getScoreTier(score);
  const cls = getScoreClasses(score);
  const ring =
    tier === "green"
      ? "border-[#10B981] text-[#10B981]"
      : tier === "amber"
        ? "border-[#F59E0B] text-[#F59E0B]"
        : "border-[#EF4444] text-[#EF4444]";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div
        className={clsx(
          "flex h-44 w-44 items-center justify-center rounded-full border-[10px] bg-white shadow-inner",
          ring,
        )}
      >
        <span className={clsx("text-6xl font-bold tabular-nums", score != null ? cls.text : "text-slate-400")}>
          {score != null ? score.toFixed(1) : "—"}
        </span>
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-slate-800">{label}</p>
      <p className={clsx("mt-1 text-center text-sm font-medium", cls.text)}>
        {score != null ? sublabel(s) : "No score"}
      </p>
    </div>
  );
}
