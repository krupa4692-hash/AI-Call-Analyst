import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Phone } from "lucide-react";
import "./globals.css";
import { NavbarActions } from "@/components/NavbarActions";
import { LogoutButton } from "@/components/LogoutButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Call Intelligence Platform",
  description: "AI-powered sales call analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white antialiased`}>
        <header className="sticky top-0 z-40 h-16 border-b border-slate-700 bg-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Phone className="h-5 w-5" strokeWidth={2} aria-hidden />
              </div>
              <span className="text-lg font-bold text-white">Call Intelligence</span>
              <span className="hidden h-4 w-px shrink-0 bg-slate-600 sm:block" aria-hidden />
              <span className="hidden truncate text-sm text-slate-400 sm:inline">
                Sales Analytics Platform
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-sm font-semibold text-slate-300">Live</span>
              </div>
              <span className="hidden h-6 w-px bg-slate-600 sm:block" aria-hidden />
              <NavbarActions />
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="page-shell min-h-[calc(100vh-4rem)] bg-white bg-gradient-premium">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>
        <footer className="border-t border-[#F1F5F9] bg-white py-6 text-center text-xs text-slate-400">
          Powered by GPT-4 + Whisper
        </footer>
      </body>
    </html>
  );
}
