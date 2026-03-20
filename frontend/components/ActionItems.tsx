import { ListChecks } from "lucide-react";

export function ActionItems({ items }: { items: string[] | undefined }) {
  const list = items ?? [];
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-800">Follow-up Action Items</h3>
        <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800">
          {list.length}
        </span>
      </div>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No action items identified</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {list.map((text, i) => (
            <li key={`${text}-${i}`} className="flex gap-3 text-sm text-slate-700">
              <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" strokeWidth={2} />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
