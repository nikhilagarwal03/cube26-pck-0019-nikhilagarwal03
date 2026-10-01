"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/branding/Logo";

export default function Home() {
  const router = useRouter();
  const [isBound, setIsBound] = useState(false);

  useEffect(() => {
    const organizationId = window.localStorage.getItem("organization_id");
    const stationId = window.localStorage.getItem("station_id");

    if (!organizationId || !stationId) {
      router.replace("/setup");
      return;
    }

    const readyTask = window.setTimeout(() => setIsBound(true), 0);
    return () => window.clearTimeout(readyTask);
  }, [router]);

  if (!isBound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Checking terminal binding...</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 py-20 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(#27272a_1px,transparent_1px),linear-gradient(90deg,#27272a_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="relative z-10 w-full max-w-5xl">
        <header className="mb-12 flex items-center justify-center gap-4">
          <Logo size={46} />
          <h1 className="font-mono text-sm font-semibold tracking-[0.24em] text-zinc-100 sm:text-base">
            PACK_MANAGER // TERMINAL_01
          </h1>
        </header>

        <nav aria-label="Pack Manager destinations" className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Link
            className="group flex h-48 flex-col justify-between border border-emerald-500/70 bg-zinc-900/70 p-7 transition duration-200 hover:scale-[1.02] hover:border-emerald-400 hover:bg-emerald-500/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
            href="/station"
          >
            <div className="flex items-start justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500">Primary operation</span>
              <span className="text-2xl text-emerald-500 transition-transform group-hover:translate-x-1">-&gt;</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">Launch Live Station</h2>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Capture and verify an outbound pack</p>
            </div>
          </Link>

          <Link
            className="group flex h-48 flex-col justify-between border border-zinc-800 bg-zinc-900/70 p-7 transition duration-200 hover:scale-[1.02] hover:border-zinc-600 hover:bg-zinc-800/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-300"
            href="/analytics"
          >
            <div className="flex items-start justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Operational intelligence</span>
              <span className="text-2xl text-zinc-500 transition-transform group-hover:translate-x-1">-&gt;</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">Warehouse Telemetry</h2>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Review risk, defects, and operator signals</p>
            </div>
          </Link>
        </nav>
      </div>
      <p className="absolute bottom-6 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-500/80">
        [ SYSTEM STATUS: VISION API CONNECTED ]
      </p>
    </main>
  );
}
