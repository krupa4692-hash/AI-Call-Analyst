"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

function formatTime(t: number): string {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ callId, fileName }: { callId: string; fileName: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const src = `${baseUrl()}/api/calls/${encodeURIComponent(callId)}/audio`;

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (playing) el.pause();
    else void el.play();
  }, [playing]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
    };
  }, [src]);

  function seek(clientX: number, el: HTMLDivElement) {
    const audio = ref.current;
    if (!audio || !duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <audio ref={ref} src={src} preload="metadata" className="hidden" />
      <p className="text-sm font-semibold text-slate-800">{fileName}</p>
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-md transition hover:bg-blue-600"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 pl-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            className="group relative h-3 w-full cursor-pointer rounded-full bg-[#F8FAFC]"
            onClick={(e) => seek(e.clientX, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" && ref.current) {
                ref.current.currentTime = Math.min(duration, ref.current.currentTime + 5);
              }
              if (e.key === "ArrowLeft" && ref.current) {
                ref.current.currentTime = Math.max(0, ref.current.currentTime - 5);
              }
            }}
          >
            <div
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[#3B82F6]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-medium text-slate-500">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
