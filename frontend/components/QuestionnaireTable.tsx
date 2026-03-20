import type { QuestionnaireCoverageRow } from "@/lib/api";
import clsx from "clsx";

export function QuestionnaireTable({ rows }: { rows: QuestionnaireCoverageRow[] | undefined }) {
  const list = rows ?? [];
  const total = list.length;
  const asked = list.filter((r) => r.asked).length;
  const pct = total ? (asked / total) * 100 : 0;

  const barColor =
    pct >= 70 ? "bg-[#10B981]" : pct >= 40 ? "bg-[#F59E0B]" : "bg-[#EF4444]";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Discovery Questions Coverage</h3>
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <span>
            <span className="font-bold text-slate-900">{asked}</span> of{" "}
            <span className="font-bold text-slate-900">{total || "—"}</span> questions covered
          </span>
          <span className="font-bold text-slate-900">{Math.round(pct)}%</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#F8FAFC]">
          <div className={clsx("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No questionnaire data for this call.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#E2E8F0]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr
                  key={r.question_id}
                  className={clsx(
                    "border-b border-[#F1F5F9] last:border-0",
                    r.asked ? "bg-white" : "bg-[#FEF2F2]",
                  )}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{r.question_id}</td>
                  <td className="px-4 py-3 text-slate-700">{r.question}</td>
                  <td className="px-4 py-3">
                    {r.asked ? (
                      <span className="font-semibold text-[#10B981]">✅ Asked</span>
                    ) : (
                      <span className="font-semibold text-[#EF4444]">❌ Not Asked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
