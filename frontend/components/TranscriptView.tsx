"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

export function TranscriptView({ transcript }: { transcript: string }) {
  const [copied, setCopied] = useState(false);
  const words = transcript.trim().split(/\s+/).filter(Boolean);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [transcript]);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-800">Call Transcript</h3>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#3B82F6] shadow-sm transition hover:bg-slate-50"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy transcript"}
        </button>
      </div>
      <div className="mt-4 max-h-[400px] overflow-y-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm leading-relaxed text-slate-700">
        {transcript.trim() ? (
          <p className="whitespace-pre-wrap">{transcript}</p>
        ) : (
          <p className="text-slate-500">No transcript available.</p>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Word count: <span className="font-semibold text-slate-700">{words.length}</span>
      </p>
    </div>
  );
}
