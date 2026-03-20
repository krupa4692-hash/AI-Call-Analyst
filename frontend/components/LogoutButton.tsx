"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/logout", {
        method: "DELETE",
      });
    } finally {
      router.push("/login");
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={busy}
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {busy ? "Logging out..." : "Logout"}
    </button>
  );
}
