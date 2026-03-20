import type { TalkTime } from "@/lib/api";
import clsx from "clsx";

export function TalkTimeBar({ talkTime }: { talkTime: TalkTime | null | undefined }) {
  const agent = talkTime?.agent_percent ?? 0;
  const customer = talkTime?.customer_percent ?? 0;
  const warnHigh = agent > 60;
  const warnLow = agent < 30 && agent > 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Talk Time Distribution</h3>
      <div className="mt-6 space-y-5">
        <div>
          <div className="mb-1 flex justify-between text-sm font-medium text-slate-700">
            <span>Agent</span>
            <span className="font-bold text-slate-900">{Math.round(agent)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#F8FAFC]">
            <div
              className="h-full rounded-full bg-[#3B82F6] transition-all duration-700"
              style={{ width: `${agent}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm font-medium text-slate-700">
            <span>Customer</span>
            <span className="font-bold text-slate-900">{Math.round(customer)}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#F8FAFC]">
            <div
              className="h-full rounded-full bg-[#10B981] transition-all duration-700"
              style={{ width: `${customer}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Ideal: Agent 40–50% | Customer 50–60%
      </p>
      {(warnHigh || warnLow) && (
        <p
          className={clsx(
            "mt-2 text-sm font-medium",
            "rounded-lg bg-[#FFFBEB] px-3 py-2 text-[#F59E0B]",
          )}
        >
          {warnHigh ? "⚠ Agent is speaking too much" : "⚠ Agent may not be engaging enough"}
        </p>
      )}
    </div>
  );
}
