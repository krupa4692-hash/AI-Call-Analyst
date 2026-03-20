import type { AgentScores as AgentScoresType } from "@/lib/api";
import { getScoreClasses, getScoreTier } from "@/lib/score";
import clsx from "clsx";

const dims: {
  key: keyof AgentScoresType;
  label: string;
  icon: string;
}[] = [
  { key: "communication_clarity", label: "Communication Clarity", icon: "💬" },
  { key: "politeness", label: "Politeness", icon: "🤝" },
  { key: "business_knowledge", label: "Business Knowledge", icon: "📚" },
  { key: "problem_handling", label: "Problem Handling", icon: "🛡️" },
  { key: "listening_ability", label: "Listening Ability", icon: "👂" },
];

function tierLabel(score: number) {
  const t = getScoreTier(score);
  if (t === "green") return "Excellent";
  if (t === "amber") return "Good";
  return "Needs Work";
}

export function AgentScores({ scores }: { scores: AgentScoresType | null | undefined }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Agent Performance Breakdown</h3>
      {!scores ? (
        <p className="mt-4 text-sm text-slate-500">No agent scores available.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dims.map((d) => {
            const v = scores[d.key];
            const cls = getScoreClasses(v);
            return (
              <div
                key={d.key}
                className={clsx(
                  "rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md",
                  cls.bg,
                  cls.border,
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden>
                    {d.icon}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{d.label}</span>
                </div>
                <p className={clsx("mt-3 text-3xl font-bold tabular-nums", cls.text)}>
                  {v.toFixed(1)}
                  <span className="text-lg font-semibold text-slate-500">/10</span>
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
                  <div className={clsx("h-full rounded-full transition-all", cls.bar)} style={{ width: `${v * 10}%` }} />
                </div>
                <p className={clsx("mt-2 text-xs font-semibold", cls.text)}>{tierLabel(v)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
