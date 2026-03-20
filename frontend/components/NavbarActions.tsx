"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { triggerProcessing } from "@/lib/api";

export function NavbarActions() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onProcess() {
    setBusy(true);
    setMsg(null);
    const r = await triggerProcessing();
    setBusy(false);
    setMsg(r?.message ?? (r ? "OK" : "Could not start queue"));
    if (r) setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onProcess}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-indigo-400 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        {busy ? "Starting…" : "Process Queue"}
      </button>
      {msg ? <span className="text-xs text-slate-500">{msg}</span> : null}
    </div>
  );
}
