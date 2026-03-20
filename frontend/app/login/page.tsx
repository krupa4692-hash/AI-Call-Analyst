"use client";

import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone } from "lucide-react";

const DEMO_EMAIL = "admin@callintelligence.com";
const DEMO_PASSWORD = "Admin@123";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const cardAnimationClass = useMemo(() => {
    return shake ? "animate-[shake_0.35s_ease-in-out]" : "";
  }, [shake]);

  function setAuthCookie() {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `auth_token=authenticated; expires=${expiresAt}; path=/; SameSite=Lax`;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 450));

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const isValid = normalizedEmail === DEMO_EMAIL && normalizedPassword === DEMO_PASSWORD;

    if (isValid) {
      setAuthCookie();
      // Force a full navigation so middleware sees the new cookie reliably.
      window.location.assign("/");
      return;
    }

    setLoading(false);
    setError("Invalid email or password. Please try again.");
    setPassword("");
    setShake(true);
    setTimeout(() => setShake(false), 380);
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="h-16 border-b border-slate-700 bg-slate-800">
        <div className="mx-auto flex h-full max-w-7xl items-center px-6">
          <span className="text-lg font-bold text-white">📞 Call Intelligence Platform</span>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
        <div className={`w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-lg ${cardAnimationClass}`}>
          <section className="rounded-t-2xl bg-slate-800 p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/30 ring-1 ring-indigo-400/40">
              <Phone className="h-8 w-8 text-indigo-300" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="mt-2 text-slate-400">Sign in to access your dashboard</p>
          </section>

          <section className="bg-white p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-11 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                />
                Remember me
              </label>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </section>
        </div>
      </main>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-8px);
          }
          75% {
            transform: translateX(8px);
          }
        }
      `}</style>
    </div>
  );
}
