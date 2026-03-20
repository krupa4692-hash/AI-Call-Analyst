export function KeywordTags({ keywords }: { keywords: string[] | undefined }) {
  const list = keywords ?? [];
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">Keywords Discussed</h3>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No keywords for this call.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {list.map((k) => (
            <span
              key={k}
              className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-900"
            >
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
